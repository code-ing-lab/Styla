import { TIER } from './tiers'

// ⚠️ 개발자 테스트 전용 목업 데이터. DevPreviewPanel에서만 사용됨.
// 실제 API를 호출하지 않고 티어별 화면(ResultView) 레이아웃만 미리 볼 때 씀 —
// 테스트 끝나면 이 파일과 src/components/DevPreviewPanel.jsx, 그리고
// Home.jsx에서 이 둘을 참조하는 부분을 지우면 됨(CLAUDE.md에도 안내해둠).
const MOCK_RESULTS = {
  [TIER.GUEST]: {
    bodyType: { primary: '스트레이트' },
    keywords: ['미니멀', '오피스', '단정'],
    basicStyleGuide: {
      ratioAnalysis: '어깨와 허리 라인이 곧게 떨어지는 스트레이트 체형에 가까워 보여요.',
      fitRecommendation: '너무 루즈하지 않은 적당한 핏이 잘 어울려요. 과한 볼륨은 피해주세요.',
      tpoStylingTip: '데일리룩에는 단정한 셔츠와 슬랙스 조합을 추천해요.',
    },
    images: [],
  },
  [TIER.MEMBER]: {
    bodyType: { primary: '슬림' },
    keywords: ['페미닌', '단정', '봄'],
    basicStyleGuide: {
      ratioAnalysis: '전체적으로 슬림한 체형에 가까워 보여요. 비율이 균형잡혀 있어 매력적입니다.',
      fitRecommendation: '몸에 적당히 맞는 핏의 의상이 추천돼요. 너무 루즈한 스타일은 피해주세요.',
      tpoStylingTip: '모임이나 파티에는 차분하면서도 세련된 느낌을 강조하는 스타일이 적합해요.',
    },
    styleTip: '소매가 약간 퍼진 블라우스와 A라인 스커트, 간편한 샌들 조합으로 스타일링해보세요.',
    images: [],
  },
  [TIER.PREMIUM]: {
    bodyType: { primary: '내추럴', primaryPercent: 65, secondary: '스트레이트', secondaryPercent: 35 },
    confidence: 4.2,
    keywords: ['미니멀', '캐주얼', '뉴트로', '오버사이즈'],
    styleGuide: {
      top: { recommended: ['오버사이즈 셔츠', '루즈핏 니트'], avoid: ['타이트한 크롭탑'], reason: '어깨선을 자연스럽게 살려줘요.' },
      bottom: { recommended: ['와이드 팬츠', '스트레이트 데님'], avoid: ['스키니진'], reason: '다리 라인을 편안하게 보완해요.' },
      dress: { recommended: ['셔츠 원피스', '벨티드 원피스'], avoid: ['타이트 미디원피스'], reason: '허리 라인을 자연스럽게 강조해요.' },
      outer: { recommended: ['롱 카디건', '오버사이즈 자켓'], avoid: ['숏 재킷'], reason: '비율감을 길어 보이게 해줘요.' },
    },
    detailGuide: {
      neckline: { recommended: ['라운드넥', '브이넥'], avoid: ['하이넥'], reason: '목선을 편안하게 드러내줘요.' },
      sleeve: { recommended: ['퍼프 소매', '루즈 소매'], avoid: ['타이트 소매'], reason: '팔 라인을 자연스럽게 보완해요.' },
      waistDetail: { recommended: ['벨트 디테일'], avoid: ['하이웨스트 밴딩'], reason: '허리를 부드럽게 강조해요.' },
      length: { recommended: ['미디 기장'], avoid: ['미니 기장'], reason: '전체 비율을 안정적으로 잡아줘요.' },
    },
    moodStyleGuide: {
      moodKeyword: '뉴트로 캐주얼',
      recommendedItems: ['체크 셔츠', '와이드 데님'],
      colorPalette: [
        { name: '아이보리', hex: '#F3EEE3' },
        { name: '코발트 블루', hex: '#2A4D8F' },
        { name: '카멜', hex: '#B08463' },
      ],
      reason: '차분한 뉴트럴 톤에 포인트 컬러를 더하면 세련된 무드를 연출할 수 있어요.',
    },
    summary: {
      oneLiner: '자연스러운 실루엣을 살리는 미니멀 뉴트로 스타일링',
      keyFormulas: ['루즈핏 상의 + 스트레이트 하의', '뉴트럴 톤 + 포인트 컬러 1가지', '롱 아우터로 세로 라인 강조'],
    },
    images: [],
  },
}

export function getMockResult(tier) {
  return MOCK_RESULTS[tier] ?? MOCK_RESULTS[TIER.GUEST]
}
