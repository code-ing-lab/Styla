export const TIER = {
  GUEST: 'guest',
  MEMBER: 'member',
  PREMIUM: 'premium',
}

// 게스트는 하루 단위가 아니라 "평생 1회"라 이 값을 한도 체크에 쓰지 않는다
// (src/lib/guestUsage.js의 hasUsedGuestTrial/markGuestTrialUsed 참고).
// 로그인/프리미엄만 여기 값 그대로 매일 초기화되는 사용량 한도로 쓰인다.
export const DAILY_LIMIT = {
  [TIER.GUEST]: 1,
  [TIER.MEMBER]: 3,
  [TIER.PREMIUM]: 5,
}

export function getTier({ isLoggedIn, isPremium }) {
  if (isPremium) return TIER.PREMIUM
  if (isLoggedIn) return TIER.MEMBER
  return TIER.GUEST
}
