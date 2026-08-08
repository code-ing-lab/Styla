export const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

export const AGE_OPTIONS = [
  { value: "10s", label: "10대" },
  { value: "20s", label: "20대" },
  { value: "30s", label: "30대" },
  { value: "40s", label: "40대" },
  { value: "50s", label: "50대" },
  { value: "60s+", label: "60대 이상" },
];

export const HEIGHT_OPTIONS = [
  { value: "under150", label: "150cm 미만" },
  { value: "150to160", label: "150~160cm" },
  { value: "160to170", label: "160~170cm" },
  { value: "170to180", label: "170~180cm" },
  { value: "over180", label: "180cm 이상" },
];

// 키 구간별 몸무게 구간 매핑
export const WEIGHT_OPTIONS_BY_HEIGHT = {
  under150: [
    { value: "35to40", label: "35~40kg" },
    { value: "40to45", label: "40~45kg" },
    { value: "45to50", label: "45~50kg" },
    { value: "over50", label: "50kg 이상" },
  ],
  "150to160": [
    { value: "40to45", label: "40~45kg" },
    { value: "45to50", label: "45~50kg" },
    { value: "50to55", label: "50~55kg" },
    { value: "over55", label: "55kg 이상" },
  ],
  "160to170": [
    { value: "45to50", label: "45~50kg" },
    { value: "50to55", label: "50~55kg" },
    { value: "55to60", label: "55~60kg" },
    { value: "over60", label: "60kg 이상" },
  ],
  "170to180": [
    { value: "55to60", label: "55~60kg" },
    { value: "60to65", label: "60~65kg" },
    { value: "65to70", label: "65~70kg" },
    { value: "over70", label: "70kg 이상" },
  ],
  over180: [
    { value: "65to70", label: "65~70kg" },
    { value: "70to75", label: "70~75kg" },
    { value: "75to80", label: "75~80kg" },
    { value: "over80", label: "80kg 이상" },
  ],
};

export const TPO_OPTIONS = [
  { value: "오피스룩", label: "오피스룩" },
  { value: "캐주얼룩", label: "캐주얼룩" },
  { value: "데이트룩", label: "데이트룩" },
  { value: "하객룩", label: "하객룩" },
  { value: "여행·캠핑룩", label: "여행·캠핑룩" },
];

// 결제 후 상세 입력 폼(구 프리미엄 폼)에서 사용하는 선택지
export const PERSONAL_COLOR_OPTIONS = ["봄 웜톤", "여름 쿨톤", "가을 웜톤", "겨울 쿨톤"];

export const FACE_SHAPE_OPTIONS = ["계란형", "둥근형", "각진형", "긴형", "하트형"];

export const BODY_COMPLEX_OPTIONS = [
  "어깨가 넓어요",
  "하체가 두꺼워요",
  "허리가 밋밋해요",
  "키가 작아요",
  "팔뚝이 신경쓰여요",
];
