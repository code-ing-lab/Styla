// 게스트 무료 체험은 날짜와 무관하게 평생 1회만 허용된다.
// (하루 단위로 초기화되지 않는, 영구적인 "이미 사용함" 플래그)
const STORAGE_KEY = 'styla-guest-trial-used'

export function hasUsedGuestTrial() {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function markGuestTrialUsed() {
  localStorage.setItem(STORAGE_KEY, 'true')
}
