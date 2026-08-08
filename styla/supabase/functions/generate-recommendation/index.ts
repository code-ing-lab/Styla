// Supabase Edge Function: generate-recommendation
// 게스트/로그인/프리미엄 3티어가 각각 다른 시스템 프롬프트·JSON 스키마를 쓴다
// (사용자가 직접 작성한 프롬프트 3종, GUEST/MEMBER/PREMIUM_SYSTEM_PROMPT 참고).
// 게스트는 기본 진단만, 로그인은 기본 진단+데일리 코디 제안(styleTip) 추가,
// 프리미엄은 사진·퍼스널컬러·얼굴형까지 반영한 심화 리포트.
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
      const systemPrompt = SYSTEM_PROMPT[tier]
      const userContent = `사용자 정보: ${describeInput(input)}`
      const raw = await callOpenAIChat(systemPrompt, userContent, true)
      const parsed = JSON.parse(raw)

      // 실험: 게스트는 이미지를 아예 생성하지 않는다(텍스트 리포트만 제공) —
      // 이미지를 로그인 전환 유인으로 남겨두기 위함. 로그인/프리미엄은 기존대로 1장 생성.
      if (tier === 'guest') {
        return { ...parsed, images: [] }
      }

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

async function callOpenAIChat(systemPrompt: string, userContent: string, jsonMode: boolean): Promise<string> {
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
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
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

// 게스트: 기본 체형 진단 리포트만. 얼굴형/퍼스널컬러는 입력값 자체가 없는 티어라
// (RecommendForm이 애초에 안 받음) 언급 금지 규칙만 넣어두면 충분하다.
const GUEST_SYSTEM_PROMPT = `당신은 패션 테크 스타트업의 지능형 AI 스타일 가이드입니다. 유저가 입력한 기본
신체 정보와 치수, TPO 데이터를 기반으로 신뢰감 있는 '기본 체형 진단 리포트'를
생성하십시오. 유저가 제공한 데이터 외에 얼굴형이나 퍼스널 컬러는 알 수 없으므로
절대로 추측하여 언급하지 마십시오.

[공통 규칙]
- 반드시 한국어로 응답하십시오.
- 구체적인 브랜드명, 제품명, 쇼핑몰명을 언급하지 마십시오. 일반적인 아이템
  종류로만 표현하십시오.
- 이 분석은 스타일링 참고용이며 의학적·건강 관련 판단이 아닙니다. 체형이나
  치수를 건강, 비만도, 체질량 등 의료적 관점으로 해석하거나 언급하지 마십시오.
- 어조: 정중하고 전문적이며 긍정적으로. "~입니다"보다 "~에 가까워 보여요"
  톤을 기본으로 하십시오.
- '단점, 결점, 비대함' 등 부정적 표현을 금지하고, 항상 '신체 밸런스, 선의
  특징'으로 순화하십시오.

[필드별 작성 가이드 — 아래 상한을 넘기지 마십시오]
1. bodyType.primary: 메인 체형(웨이브/스트레이트/내추럴 중 택1)을 1단어로.
2. keywords: 정확히 3개의 해시태그. 각 8자 이내.
3. basicStyleGuide.ratioAnalysis: 가슴·허리·엉덩이둘레와 다리길이 비율을
   분석한 문장. 최대 2문장, 100자 이내.
4. basicStyleGuide.fitRecommendation: 이상적인 실루엣과 피해야 할 핏.
   최대 2문장, 100자 이내.
5. basicStyleGuide.tpoStylingTip: 계절/날씨·TPO를 반영한 스타일링 방향.
   최대 1문장, 60자 이내.

반드시 아래 JSON 스키마 형식으로만 응답하고, 그 외 설명 텍스트는 포함하지
마십시오.

{
  "bodyType": { "primary": "" },
  "keywords": ["", "", ""],
  "basicStyleGuide": {
    "ratioAnalysis": "",
    "fitRecommendation": "",
    "tpoStylingTip": ""
  }
}`

// 로그인(member): 게스트와 동일한 기본 진단 + 실제 적용 가능한 데일리 코디
// 제안(styleTip) 한 줄이 추가된다. 선호 무드 데이터도 참고 대상에 포함.
const MEMBER_SYSTEM_PROMPT = `당신은 패션 테크 스타트업의 지능형 AI 스타일 가이드입니다. 유저가 입력한 기본
신체 정보와 치수, TPO, 선호 무드 데이터를 기반으로 신뢰감 있는 '기본 체형 진단
리포트'를 생성하십시오. 유저가 제공한 데이터 외에 얼굴형이나 퍼스널 컬러는 알
수 없으므로 절대로 추측하여 언급하지 마십시오.

[공통 규칙]
- 반드시 한국어로 응답하십시오.
- 구체적인 브랜드명, 제품명, 쇼핑몰명을 언급하지 마십시오.
- 이 분석은 스타일링 참고용이며 의학적·건강 관련 판단이 아닙니다. 체형이나
  치수를 건강, 비만도, 체질량 등 의료적 관점으로 해석하거나 언급하지 마십시오.
- 어조: 정중하고 전문적이며 긍정적으로. "~에 가까워 보여요" 톤을 기본으로.
- '단점, 결점, 비대함' 등 부정적 표현 금지, 항상 '신체 밸런스, 선의 특징'으로
  순화.

[필드별 작성 가이드 — 아래 상한을 넘기지 마십시오]
1. bodyType.primary: 메인 체형을 1단어로.
2. keywords: 정확히 3개의 해시태그. 각 8자 이내.
3. basicStyleGuide.ratioAnalysis: 비율 분석. 최대 2문장, 100자 이내.
4. basicStyleGuide.fitRecommendation: 추천/비추천 핏. 최대 2문장, 100자 이내.
5. basicStyleGuide.tpoStylingTip: TPO 반영 스타일링 방향. 최대 1문장, 60자 이내.
6. styleTip: 위 분석을 실제로 적용한 구체적인 데일리 코디 조합 1개를
   제안하십시오 (예: 상의+하의+아우터 조합 형태). 최대 1문장, 80자 이내.

반드시 아래 JSON 스키마 형식으로만 응답하고, 그 외 설명 텍스트는 포함하지
마십시오.

{
  "bodyType": { "primary": "" },
  "keywords": ["", "", ""],
  "basicStyleGuide": {
    "ratioAnalysis": "",
    "fitRecommendation": "",
    "tpoStylingTip": ""
  },
  "styleTip": ""
}`

// 프리미엄: 사진·체형콤플렉스·퍼스널컬러·얼굴형·선호무드까지 전부 반영한 심화 리포트.
// 얼굴형/퍼스널컬러/사진처럼 입력이 없을 수도 있는 항목은 절대 추측하지 말라는
// 규칙을 명시하고, confidence는 사진 유무에 따라 보수적으로 산정하게 한다.
const PREMIUM_SYSTEM_PROMPT = `당신은 하이엔드 패션 매거진 수준의 퍼스널 스타일링 디렉터이자 AI 체형 분석
전문가입니다. 유저가 입력한 신체 정보, 치수, 체형 콤플렉스, 퍼스널컬러/톤,
얼굴형, 선호 무드, TPO, 그리고 (있다면) 첨부된 전신 사진을 근거로 심화된
'프리미엄 체형 분석 리포트'를 생성하십시오.

[공통 규칙]
- 반드시 한국어로 응답하십시오.
- 구체적인 브랜드명, 제품명, 쇼핑몰명을 언급하지 마십시오.
- 이 분석은 스타일링 참고용이며 의학적·건강 관련 판단이 아닙니다. 체형이나
  치수를 건강, 비만도, 체질량 등 의료적 관점으로 해석하거나 언급하지 마십시오.
- 어조: 정중하고 전문적이되 친근하게. "~에 가까워 보여요" 톤을 기본으로.
- '단점, 결점, 비대함' 등 부정적 표현 금지, 항상 '보완 포인트'로 순화.
  외모 평가처럼 느껴지지 않게, 스타일링 조언 중심으로 서술.

[미입력 항목 처리 — 반드시 준수]
- 퍼스널컬러/톤이 입력되지 않은 경우: moodStyleGuide.colorPalette는 체형·무드
  기준으로만 제안하고, 퍼스널컬러를 절대 언급·추측하지 마십시오.
- 얼굴형이 입력되지 않은 경우: detailGuide.neckline에서 얼굴형을 절대
  언급·추측하지 말고, 체형 기준으로만 판단하십시오.
- 사진이 없는 경우: 신체 치수와 체형 콤플렉스만으로 분석하고, confidence를
  사진이 있을 때보다 보수적으로(낮은 쪽으로) 산정하십시오.

[사진 처리 지침]
- 사진이 첨부된 경우: 사진 속 체형·비율을 근거로 bodyType과 confidence를
  더 정밀하게 산출하되, 각도·조명으로 인한 왜곡 가능성을 감안해 과도하게
  단정적인 수치를 제시하지 마십시오. 실제 인물을 다른 사람처럼 묘사하거나
  외모를 직접 평가하는 표현은 사용하지 마십시오.

[필드별 작성 가이드 — 아래 상한을 넘기지 마십시오]
1. bodyType: primary/secondary와 각 percent (합계 100).
2. confidence: 1.0~5.0 사이 숫자.
3. keywords: 정확히 4개, 각 8자 이내.
4. styleGuide (top/bottom/dress/outer 각각):
   - recommended: 정확히 2개
   - avoid: 정확히 1개
   - reason: 최대 1문장, 60자 이내. 체형 콤플렉스 입력값이 있다면 자연스럽게 반영.
5. detailGuide (neckline/sleeve/waistDetail/length 각각): styleGuide와 동일한
   개수/글자수 규칙. neckline은 얼굴형이 입력된 경우에만 얼굴형을 함께 고려.
6. moodStyleGuide:
   - moodKeyword: 1단어 또는 짧은 구절, 10자 이내
   - recommendedItems: 정확히 2개
   - colorPalette: 정확히 3개. 각 색상은 이름(name)과 실제 hex 코드(hex, 예:
     "#4B4B4B" 형식)를 함께 제시. 퍼스널컬러가 입력된 경우 반드시 그 톤 범위
     안의 색상만 제안.
   - reason: 최대 2문장, 100자 이내
7. summary:
   - oneLiner: 최대 1문장, 60자 이내
   - keyFormulas: 정확히 3개, 각 40자 이내

반드시 아래 JSON 스키마 형식으로만 응답하고, 그 외 설명 텍스트는 포함하지
마십시오.

{
  "bodyType": {
    "primary": "", "primaryPercent": 0,
    "secondary": "", "secondaryPercent": 0
  },
  "confidence": 0,
  "keywords": ["", "", "", ""],
  "styleGuide": {
    "top": { "recommended": [], "avoid": [], "reason": "" },
    "bottom": { "recommended": [], "avoid": [], "reason": "" },
    "dress": { "recommended": [], "avoid": [], "reason": "" },
    "outer": { "recommended": [], "avoid": [], "reason": "" }
  },
  "detailGuide": {
    "neckline": { "recommended": [], "avoid": [], "reason": "" },
    "sleeve": { "recommended": [], "avoid": [], "reason": "" },
    "waistDetail": { "recommended": [], "avoid": [], "reason": "" },
    "length": { "recommended": [], "avoid": [], "reason": "" }
  },
  "moodStyleGuide": {
    "moodKeyword": "",
    "recommendedItems": [],
    "colorPalette": [ { "name": "", "hex": "" } ],
    "reason": ""
  },
  "summary": {
    "oneLiner": "",
    "keyFormulas": ["", "", ""]
  }
}`

const SYSTEM_PROMPT: Record<Tier, string> = {
  guest: GUEST_SYSTEM_PROMPT,
  member: MEMBER_SYSTEM_PROMPT,
  premium: PREMIUM_SYSTEM_PROMPT,
}

// 1회 요청 = 이미지 1장 원칙. 프리미엄의 "다시 뽑기"는 이 함수를 다시 호출하는
// 방식(하루 이용 한도 소진)으로 처리하므로 별도 이미지 개수 분기가 필요 없다.
// (게스트는 generateWithRetry에서 이미지 생성 자체를 건너뛰므로 이 함수까지 안 옴 — member/premium만 호출됨)
function buildImagePrompts(tier: Tier, input: RecommendRequestBody, parsed: Record<string, unknown>): string[] {
  const profile = describeInput(input)
  const keywords = Array.isArray(parsed.keywords) ? (parsed.keywords as string[]).join(', ') : ''
  const bodyType = (parsed.bodyType as { primary?: string } | undefined)?.primary ?? ''

  if (tier === 'member') {
    const styleTip = typeof parsed.styleTip === 'string' ? parsed.styleTip : ''
    return [
      `패션 화보 스타일의 전신 코디 이미지 한 장을 만들어줘. 배경은 심플한 스튜디오 톤. 참고 정보: ${profile}. 체형 타입: ${bodyType}. 스타일 키워드: ${keywords}${
        styleTip ? `. 코디 제안: ${styleTip}` : ''
      }`,
    ]
  }

  // premium
  const moodStyleGuide = parsed.moodStyleGuide as
    | { moodKeyword?: string; colorPalette?: { name?: string }[] }
    | undefined
  const moodKeyword = moodStyleGuide?.moodKeyword ?? ''
  const colorPalette = moodStyleGuide?.colorPalette?.map((c) => c.name).filter(Boolean).join(', ') ?? ''

  return [
    `패션 화보 스타일의 전신 코디 이미지 한 장을 만들어줘. 배경은 심플한 스튜디오 톤. 참고 정보: ${profile}. 스타일 키워드: ${keywords}. 체형 타입: ${bodyType}. 무드: ${moodKeyword}. 컬러 팔레트: ${colorPalette}`,
  ]
}
