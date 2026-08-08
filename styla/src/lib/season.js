// index: 0=1월 ... 11=12월
const SEASONS = ["겨울", "겨울", "봄", "봄", "봄", "여름", "여름", "여름", "가을", "가을", "가을", "겨울"];

// 월(1~12) 기준으로 현재 계절을 자동 계산한다. 유저에게 묻지 않고 내부적으로만 사용.
export function getCurrentSeason(date = new Date()) {
  const month = date.getMonth();
  return SEASONS[month];
}
