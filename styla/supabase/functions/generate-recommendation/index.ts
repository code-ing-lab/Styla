// Supabase Edge Function: generate-recommendation
// 티어(guest / member / premium)에 따라 다른 스키마의 AI 코디 추천 결과(텍스트+이미지)를 반환한다.
// OpenAI API 키는 반드시 Supabase Edge Function Secrets(`supabase secrets set OPENAI_API_KEY=...`)로만
// 주입한다. 프론트엔드(src/**)에는 이 키가 절대 노출되지 않는다.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { DAILY_LIMIT, IMAGE_QUALITY, OPENAI_IMAGE_MODEL, OPENAI_TEXT_MODEL, type Tier } from '../_shared/config.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

class LimitExceededError extends Error {}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecommendRequestBody {
  // 기본 정보 (모든 티어 공통, 항상 입력)
  gender: string
  age?: number
  height: number
  weight: number
  // "상세조건 더보기"로 접어둔 선택 입력 (모든 티어 공통)
  bust?: number
  waist?: number
  hip?: number
  legLength?: number
  season?: string
  tpo?: string
  // 무료/로그인은 상세조건 더보기 안에서, 프리미엄은 "프리미엄 상세조건" 안에서 받는다
  preferredMood?: string
  // 프리미엄 상세조건 (프리미엄 전용)
  faceShape?: string
  personalColor?: string
  bodyComplex?: string
  photoUrl?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body: RecommendRequestBody = await req.json()
    const { tier, userId } = await resolveAuth(req)

    // 로그인/프리미엄은 하루 한도를 서버에서 직접 검증한다.
    // (클라이언트의 사전 체크는 UX용일 뿐, 실제 강제는 여기서만 해야 우회할 수 없다.)
    if (userId) {
      await assertUnderDailyLimit(userId, tier as 'member' | 'premium')
    }

    const result = await generateWithRetry(tier, body)

    if (userId) {
      await incrementDailyUsage(userId).catch((err) =>
        console.error('[generate-recommendation] usage_logs 증가 실패:', err)
      )
    }

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    if (error instanceof LimitExceededError) {
      return new Response(JSON.stringify({ error: 'limit_exceeded', message: error.message }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 429,
      })
    }

    console.error('[generate-recommendation] error:', error)
    return new Response(
      JSON.stringify({ error: '추천 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// Authorization 헤더로 로그인 사용자를 식별하고, subscriptions 테이블을 조회해
// 실제 티어(guest/member/premium)를 서버에서 신뢰성 있게 판별한다.
// (클라이언트가 보낸 tier 값을 그대로 믿지 않는다.)
async function resolveAuth(req: Request): Promise<{ tier: Tier; userId: string | null }> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return { tier: 'guest', userId: null }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { tier: 'guest', userId: null }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle()

  const tier: Tier = subscription?.status === 'active' ? 'premium' : 'member'
  return { tier, userId: user.id }
}

function adminClient() {
  // usage_logs는 RLS상 클라이언트에서 읽기(select)만 가능하므로,
  // 한도 체크/증가는 서비스 롤 키로만 수행해 사용자가 직접 조작할 수 없게 한다.
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

async function assertUnderDailyLimit(userId: string, tier: 'member' | 'premium') {
  const { data, error } = await adminClient()
    .from('usage_logs')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', todayString())
    .maybeSingle()

  if (error) throw error

  const count = data?.count ?? 0
  if (count >= DAILY_LIMIT[tier]) {
    throw new LimitExceededError('오늘의 이용 횟수를 모두 사용했습니다.')
  }
}

async function incrementDailyUsage(userId: string) {
  const admin = adminClient()
  const { data, error: selectError } = await admin
    .from('usage_logs')
    .select('count')
    .eq('user_id', userId)
    .eq('usage_date', todayString())
    .maybeSingle()

  if (selectError) throw selectError

  const { error: upsertError } = await admin
    .from('usage_logs')
    .upsert(
      { user_id: userId, usage_date: todayString(), count: (data?.count ?? 0) + 1 },
      { onConflict: 'user_id,usage_date' }
    )

  if (upsertError) throw upsertError
}

async function generateWithRetry(tier: Tier, input: RecommendRequestBody, maxRetries = 2) {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (tier === 'guest') {
        const description = (await callOpenAIChat(buildTextPrompt('guest', input), false)).trim()
        const image = await callOpenAIImage(buildGuestImagePrompt(input, description), IMAGE_QUALITY.guest)
        return { description, images: [image] }
      }

      const raw = await callOpenAIChat(buildTextPrompt(tier, input), true)
      const parsed = JSON.parse(raw)

      const imagePrompts = buildImagePrompts(tier, input, parsed)
      const images = await Promise.all(imagePrompts.map((prompt) => callOpenAIImage(prompt, IMAGE_QUALITY[tier])))

      return { ...parsed, images }
    } catch (error) {
      lastError = error
      console.warn(`[generate-recommendation] attempt ${attempt} failed:`, error)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI 응답 생성/파싱 실패')
}

async function callOpenAIChat(prompt: string, jsonMode: boolean): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다 (Edge Function Secrets 확인)')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_TEXT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI 텍스트 생성 실패 (${response.status}): ${await response.text()}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callOpenAIImage(prompt: string, quality: 'low' | 'medium' | 'high'): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다 (Edge Function Secrets 확인)')
  }

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt,
      size: '1024x1024',
      quality,
      n: 1,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI 이미지 생성 실패 (${response.status}): ${await response.text()}`)
  }

  const data = await response.json()
  const b64 = data.data?.[0]?.b64_json
  if (b64) return `data:image/png;base64,${b64}`

  const url = data.data?.[0]?.url
  if (url) return url

  throw new Error('OpenAI 이미지 응답에 이미지 데이터가 없습니다.')
}

function describeInput(input: RecommendRequestBody): string {
  const parts = [
    `성별 ${input.gender}`,
    `키 ${input.height}cm`,
    `몸무게 ${input.weight}kg`,
    input.age && `나이 ${input.age}세`,
    input.bust && `가슴둘레 ${input.bust}cm`,
    input.waist && `허리둘레 ${input.waist}cm`,
    input.hip && `엉덩이둘레 ${input.hip}cm`,
    input.legLength && `다리길이 ${input.legLength}cm`,
    input.season && `계절/날씨 ${input.season}`,
    input.tpo && `TPO ${input.tpo}`,
    input.preferredMood && `선호 무드/스타일 ${input.preferredMood}`,
    input.personalColor && `퍼스널컬러 ${input.personalColor}`,
    input.faceShape && `얼굴형 ${input.faceShape}`,
    input.bodyComplex && `체형 콤플렉스 ${input.bodyComplex}`,
  ].filter(Boolean)
  return parts.join(', ')
}

function buildTextPrompt(tier: Tier, input: RecommendRequestBody): string {
  const profile = describeInput(input)

  if (tier === 'guest') {
    return `다음 사용자 정보를 참고해 어울리는 코디를 자연스러운 한국어로 2~3문장만 추천해줘. JSON이나 목록 없이 문장으로만 답해줘.\n사용자 정보: ${profile}`
  }

  if (tier === 'member') {
    return `다음 사용자 정보를 참고해 코디 한 벌을 추천하고, 매거진/블로그 스타일의 짧은 리포트를 작성해줘.
아래 JSON 스키마를 정확히 지켜서 JSON만 출력해줘 (설명 문장 없이 JSON만):
{
  "title": "string (매거진 타이틀처럼 감성적인 코디 제목, 15자 내외)",
  "keywords": ["string", "string", "string"],
  "paragraphs": ["string", "string"]
}
paragraphs는 2~3개 문단으로, ①코디 설명 ②체형·분위기 분석 ③스타일링 팁 순서 내용이
자연스럽게 이어지는 매거진 글처럼 작성해줘. 각 문단은 2~4문장.
사용자 정보: ${profile}`
  }

  // premium
  return `다음 사용자 정보를 참고해 심화 스타일 리포트를 작성하고, 아래 JSON 스키마를 정확히 지켜서 JSON만 출력해줘 (설명 문장 없이 JSON만):
{
  "bodyType": { "primary": "string", "primaryPercent": 0, "secondary": "string", "secondaryPercent": 0 },
  "confidence": 0,
  "keywords": ["string"],
  "styleGuide": {
    "top": { "recommended": ["string"], "avoid": ["string"], "reason": "string" },
    "bottom": { "recommended": ["string"], "avoid": ["string"], "reason": "string" },
    "dress": { "recommended": ["string"], "avoid": ["string"], "reason": "string" },
    "outer": { "recommended": ["string"], "avoid": ["string"], "reason": "string" }
  },
  "detailGuide": {
    "neckline": { "recommended": ["string"], "avoid": ["string"], "reason": "string" },
    "sleeve": { "recommended": ["string"], "avoid": ["string"], "reason": "string" },
    "waistDetail": { "recommended": ["string"], "avoid": ["string"], "reason": "string" },
    "length": { "recommended": ["string"], "avoid": ["string"], "reason": "string" }
  },
  "summary": { "oneLiner": "string", "keyFormulas": ["string", "string", "string"] }
}
confidence는 0~5 사이 소수, primaryPercent와 secondaryPercent의 합은 100이어야 해.
사용자 정보: ${profile}`
}

function buildGuestImagePrompt(input: RecommendRequestBody, description: string): string {
  return `패션 화보 스타일의 전신 코디 이미지 한 장을 만들어줘. 배경은 심플한 스튜디오 톤. 참고 정보: ${describeInput(
    input
  )}. 코디 컨셉: ${description}`
}

// 1회 요청 = 이미지 1장 원칙. 프리미엄의 "다시 뽑기"는 이 함수를 다시 호출하는
// 방식(하루 이용 한도 소진)으로 처리하므로 별도 이미지 개수 분기가 필요 없다.
function buildImagePrompts(tier: Tier, input: RecommendRequestBody, parsed: Record<string, unknown>): string[] {
  const profile = describeInput(input)
  const keywords = Array.isArray(parsed.keywords) ? (parsed.keywords as string[]).join(', ') : ''

  if (tier === 'member') {
    return [
      `패션 화보 스타일의 전신 코디 이미지 한 장을 만들어줘. 배경은 심플한 스튜디오 톤. 참고 정보: ${profile}. 스타일 키워드: ${keywords}. 컨셉: ${
        parsed.title ?? ''
      }`,
    ]
  }

  // premium
  const bodyType = (parsed.bodyType as { primary?: string } | undefined)?.primary ?? ''
  return [
    `패션 화보 스타일의 전신 코디 이미지 한 장을 만들어줘. 배경은 심플한 스튜디오 톤. 참고 정보: ${profile}. 스타일 키워드: ${keywords}. 체형 타입: ${bodyType}`,
  ]
}
