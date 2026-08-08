export const TIERS = [
  {
    id: "tier1",
    name: "실전 낱개 스페셜",
    price: 2900,
    badge: null,
    description: "기본 체형 진단 + 현재 계절 코디 + 선택한 TPO 1개",
    features: [
      "기본 체형 & 분위기 진단",
      "현재 계절 코디 1개",
      "선택한 TPO 스타일링 1개",
    ],
  },
  {
    id: "tier2",
    name: "4계절 올인원 패키지",
    price: 4900,
    badge: "가장 인기",
    description: "기본 체형 진단 + 4계절 전체 코디 + 선택한 TPO 1개",
    features: [
      "기본 체형 & 분위기 진단",
      "봄·여름·가을·겨울 전체 코디",
      "선택한 TPO 스타일링 1개",
    ],
  },
  {
    id: "tier3",
    name: "VIP TPO 프리패스",
    price: 7900,
    badge: null,
    description: "기본 체형 진단 + 4계절 전체 + 모든 TPO 상황 전체",
    features: [
      "기본 체형 & 분위기 진단",
      "봄·여름·가을·겨울 전체 코디",
      "모든 TPO 상황 스타일링 전체",
    ],
  },
];

export function getTierById(tierId) {
  return TIERS.find((tier) => tier.id === tierId) ?? null;
}
