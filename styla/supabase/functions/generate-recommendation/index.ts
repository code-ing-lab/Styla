// Supabase Edge Function: generate-recommendation
// 티어(guest / member / premium)에 따라 다른 스키마의 AI 코디 추천 결과(텍스트+이미지)를 반환한다.
// OpenAI API 키는 반드시 Supabase Edge Function Secrets(`supabase secrets set OPENAI_API_KEY=...`)로만
// 주입한다. 프론트엔드(src/**)에는 이 키가 절대 노출되지 않는다.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { IMAGE_COUNT, IMAGE_QUALITY, OPENAI_IMAGE_MODEL, OPENAI_TEXT_MODEL, type Tier } from '../_shared/config.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RecommendRequestBody {
  // 공통 입력 (모든 티어)
  gender: string
  height: number
  weight: number
  age?: number
  bust?: number
  waist?: number
  hip?: number
  legLength?: number
  season?: string
  tpo?: string
  // 프리미엄 전용 입력
  personalColor?: string
  faceShape?: string
  bodyComplex?: string[]
  photoUrl?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body: RecommendRequestBody = await req.json()
    const tier = await resolveTier(req)
    const result = await generateWithRetry(tier, body)

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
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
async function resolveTier(req: Request): Promise<Tier> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return 'guest'

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return 'guest'

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .maybeSingle()

  return subscription?.status === 'active' ? 'premium' : 'member'
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

async function callOpenAIImage(prompt: string, quality: 'medium' | 'high'): Promise<string> {
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
    input.personalColor && `퍼스널컬러 ${input.personalColor}`,
    input.faceShape && `얼굴형 ${input.faceShape}`,
    input.bodyComplex?.length && `체형 고민 ${input.bodyComplex.join(', ')}`,
  ].filter(Boolean)
  return parts.join(', ')
}

function buildTextPrompt(tier: Tier, input: RecommendRequestBody): string {
  const profile = describeInput(input)

  if (tier === 'guest') {
    return `다음 사용자 정보를 참고해 어울리는 코디를 자연스러운 한국어로 2~3문장만 추천해줘. JSON이나 목록 없이 문장으로만 답해줘.\n사용자 정보: ${profile}`
  }

  if (tier === 'member') {
    return `다음 사용자 정보를 참고해 서로 다른 코디 3벌을 추천하고, 아래 JSON 스키마를 정확히 지켜서 JSON만 출력해줘 (설명 문장 없이 JSON만):
{
  "items": [
    { "keywords": ["string", "string"], "shortDescription": "string" }
  ],
  "analysis": "체형·분위기에 대한 2~3문장 분석",
  "tips": "스타일링 팁 1~2문장"
}
items 배열은 정확히 3개여야 해.
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
  return `패션 화보 스타일의 코디 이미지를 만들어줘. 한 장의 이미지 안에 코디를 3가지 각도/구성으로 보여주는 1x3 그리드 콜라주 형태로 구성해줘. 배경은 심플한 스튜디오 톤. 참고 정보: ${describeInput(
    input
  )}. 코디 컨셉: ${description}`
}

function buildImagePrompts(
  tier: Tier,
  input: RecommendRequestBody,
  parsed: Record<string, unknown>
): string[] {
  const profile = describeInput(input)
  const count = IMAGE_COUNT[tier]

  if (tier === 'member') {
    const items = Array.isArray(parsed.items) ? (parsed.items as Array<{ keywords?: string[]; shortDescription?: string }>) : []
    return Array.from({ length: count }).map((_, i) => {
      const item = items[i]
      const keywords = item?.keywords?.join(', ') ?? ''
      return `패션 화보 스타일의 전신 코디 이미지 한 장을 만들어줘. 배경은 심플한 스튜디오 톤. 참고 정보: ${profile}. 스타일 키워드: ${keywords}. 설명: ${
        item?.shortDescription ?? ''
      }`
    })
  }

  // premium: 카테고리별로 다른 각도의 코디 이미지를 만든다.
  const CATEGORY_HINTS = ['상의 중심 데일리룩', '하의 중심 룩', '원피스 룩', '아우터 포인트 룩', '오피스/포멀 룩', '주말 캐주얼 룩']
  const keywords = Array.isArray(parsed.keywords) ? (parsed.keywords as string[]).join(', ') : ''
  return Array.from({ length: count }).map(
    (_, i) =>
      `패션 화보 스타일의 전신 코디 이미지 한 장을 만들어줘. 배경은 심플한 스튜디오 톤. 참고 정보: ${profile}. 전체 스타일 키워드: ${keywords}. 이번 컷의 컨셉: ${
        CATEGORY_HINTS[i % CATEGORY_HINTS.length]
      }`
  )
}
