// Edge Functions 전역에서 공유하는 AI 모델/화질/이미지 수 설정.
// gpt-image-1-mini는 추후 폐지·모델 교체 가능성이 있으므로 코드 곳곳에 하드코딩하지 않고
// 이 파일(과 필요시 Edge Function Secrets의 OPENAI_TEXT_MODEL/OPENAI_IMAGE_MODEL)에서만 관리한다.

export const OPENAI_TEXT_MODEL = Deno.env.get('OPENAI_TEXT_MODEL') ?? 'gpt-4o-mini'
export const OPENAI_IMAGE_MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1-mini'

export type Tier = 'guest' | 'member' | 'premium'

// 화질: 게스트/로그인은 medium, 프리미엄은 high (원가 관리 목적)
export const IMAGE_QUALITY: Record<Tier, 'medium' | 'high'> = {
  guest: 'medium',
  member: 'medium',
  premium: 'high',
}

// 티어별 생성 이미지 수
// - 게스트: 1x3 그리드로 합성된 이미지 1장
// - 로그인: 코디별 개별 이미지 3장
// - 프리미엄: 코디별 개별 이미지 6장
export const IMAGE_COUNT: Record<Tier, number> = {
  guest: 1,
  member: 3,
  premium: 6,
}

// 로그인/프리미엄 하루 이용 한도. usage_logs 체크·증가는 이 값을 기준으로
// generate-recommendation Edge Function이 서버에서만 수행한다.
// (게스트는 하루 단위가 아니라 평생 1회이며 localStorage로만 관리되므로 여기 포함하지 않는다.)
export const DAILY_LIMIT: Record<'member' | 'premium', number> = {
  member: 3,
  premium: 5,
}
