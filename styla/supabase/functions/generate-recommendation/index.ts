// Supabase Edge Function: generate-recommendation
// 티어(guest / member / premium)에 따라 다른 스키마의 AI 코디 추천 결과를 반환한다.
// 실제 배포는 Supabase 대시보드/CLI에서 이루어지며, AI API 키는 반드시
// Supabase Edge Function Secrets(`supabase secrets set AI_API_KEY=...`)로만 주입한다.
// 프론트엔드(src/**)에는 이 키가 절대 노출되지 않는다.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const AI_API_KEY = Deno.env.get('AI_API_KEY')
// TODO: 실제 사용할 AI 제공자(예: Anthropic/OpenAI 등)의 엔드포인트로 교체
const AI_API_ENDPOINT = Deno.env.get('AI_API_ENDPOINT') ?? ''

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Tier = 'guest' | 'member' | 'premium'

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
      const raw = await callAiProvider(tier, input)

      if (tier === 'guest') {
        // 게스트는 JSON 구조 없이 텍스트 2~3문장만 반환
        return { description: raw.trim() }
      }

      return JSON.parse(raw)
    } catch (error) {
      lastError = error
      console.warn(`[generate-recommendation] attempt ${attempt} failed:`, error)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('AI 응답 생성/파싱 실패')
}

async function callAiProvider(tier: Tier, input: RecommendRequestBody): Promise<string> {
  if (!AI_API_KEY || !AI_API_ENDPOINT) {
    throw new Error('AI_API_KEY / AI_API_ENDPOINT가 설정되지 않았습니다 (Edge Function Secrets 확인)')
  }

  const prompt = buildPrompt(tier, input)

  // TODO: 실제 AI 제공자 API 스펙에 맞게 요청/응답 파싱 구현
  const response = await fetch(AI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  })

  if (!response.ok) {
    throw new Error(`AI API 호출 실패: ${response.status}`)
  }

  const data = await response.json()
  return data.text ?? data.content ?? ''
}

function buildPrompt(tier: Tier, input: RecommendRequestBody): string {
  const base = `사용자 정보: ${JSON.stringify(input)}`

  if (tier === 'guest') {
    return `${base}\n\n위 정보를 바탕으로 코디를 2~3문장으로 짧게 추천해줘. JSON 없이 텍스트만.`
  }

  if (tier === 'member') {
    return `${base}\n\n아래 JSON 스키마를 반드시 지켜서 3개 코디를 추천해줘 (JSON만 출력):
{
  "items": [{ "keywords": ["string"], "shortDescription": "string" }],
  "analysis": "string",
  "tips": "string"
}`
  }

  // premium
  return `${base}\n\n아래 JSON 스키마를 반드시 지켜서 심화 리포트를 작성해줘 (JSON만 출력):
{
  "bodyType": { "primary": "string", "primaryPercent": 0, "secondary": "string", "secondaryPercent": 0 },
  "confidence": 0,
  "keywords": ["string"],
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
  "summary": { "oneLiner": "", "keyFormulas": ["", "", ""] }
}`
}
