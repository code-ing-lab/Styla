// Edge Functions 전역에서 공유하는 AI 모델/화질/이미지 수 설정.
// gpt-image-1-mini는 추후 폐지·모델 교체 가능성이 있으므로 코드 곳곳에 하드코딩하지 않고
// 이 파일(과 필요시 Edge Function Secrets의 OPENAI_TEXT_MODEL/OPENAI_IMAGE_MODEL)에서만 관리한다.

export const OPENAI_TEXT_MODEL = Deno.env.get('OPENAI_TEXT_MODEL') ?? 'gpt-4o-mini'
export const OPENAI_IMAGE_MODEL = Deno.env.get('OPENAI_IMAGE_MODEL') ?? 'gpt-image-1-mini'

export type Tier = 'guest' | 'member' | 'premium'

// 화질: 게스트/로그인은 원가 절감을 위해 low, 프리미엄만 high 유지 (원가 관리 목적).
// 실제 화질 차이는 배포 후 육안으로 확인해서 조정 가능하도록 상수 하나로 분리해둔다.
export const IMAGE_QUALITY: Record<Tier, 'low' | 'medium' | 'high'> = {
  guest: 'low',
  member: 'low',
  premium: 'high',
}

// 티어별 생성 이미지 수. "1회 요청 = 1장" 원칙으로 전 티어 1장씩만 생성한다.
// 프리미엄의 "다시 뽑기"는 별도 크레딧 없이 하루 이용 한도(DAILY_LIMIT) 안에서
// 같은 생성 요청을 다시 호출하는 방식으로 처리한다 (재뽑기 = 한도 1회 추가 소진).
export const IMAGE_COUNT: Record<Tier, number> = {
  guest: 1,
  member: 1,
  premium: 1,
}

// 로그인/프리미엄 하루 이용 한도. usage_logs 체크·증가는 이 값을 기준으로
// generate-recommendation Edge Function이 서버에서만 수행한다.
// (게스트는 하루 단위가 아니라 평생 1회이며 localStorage로만 관리되므로 여기 포함하지 않는다.)
export const DAILY_LIMIT: Record<'member' | 'premium', number> = {
  member: 3,
  premium: 5,
}
