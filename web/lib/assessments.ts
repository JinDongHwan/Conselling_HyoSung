// PHQ-9 / GAD-7 (Pfizer, 사용 허가 불필요)
// ⚠ 문항은 이해를 돕기 위한 번역입니다. 정식 서비스 전 타당도가 검증된 한국어판 문항으로 교체하세요.

export const SCALE = ["전혀 아니다", "며칠 동안", "일주일 이상", "거의 매일"];

export const ASSESSMENTS = {
  "PHQ-9": {
    name: "우울 자가진단 (PHQ-9)",
    intro: "지난 2주 동안, 다음과 같은 문제를 얼마나 자주 겪었나요?",
    max: 27,
    items: [
      "일을 하는 것에 흥미나 즐거움이 거의 없었다",
      "기분이 가라앉거나, 우울하거나, 희망이 없다고 느꼈다",
      "잠들기 어렵거나 자주 깼다, 혹은 너무 많이 잤다",
      "피곤하다고 느끼거나 기운이 거의 없었다",
      "식욕이 줄었거나 혹은 너무 많이 먹었다",
      "내 자신이 실패자로 여겨지거나, 나 때문에 가족이 실망했다고 느꼈다",
      "신문을 읽거나 TV를 보는 것처럼 일상적인 일에 집중하기 어려웠다",
      "다른 사람들이 눈치챌 정도로 느리게 움직이거나 말했다, 혹은 너무 안절부절못했다",
      "차라리 죽는 것이 낫겠다거나 어떻게든 자해를 하려는 생각이 들었다",
    ],
    bands: [
      { from: 0, to: 4, label: "정상 범위" },
      { from: 5, to: 9, label: "가벼운 우울" },
      { from: 10, to: 14, label: "중간 정도 우울" },
      { from: 15, to: 19, label: "다소 심한 우울" },
      { from: 20, to: 27, label: "심한 우울" },
    ],
  },
  "GAD-7": {
    name: "불안 자가진단 (GAD-7)",
    intro: "지난 2주 동안, 다음과 같은 문제를 얼마나 자주 겪었나요?",
    max: 21,
    items: [
      "초조하거나 불안하거나 조마조마하게 느꼈다",
      "걱정하는 것을 멈추거나 조절할 수가 없었다",
      "여러 가지 것들에 대해 걱정을 너무 많이 했다",
      "편하게 있기가 어려웠다",
      "너무 안절부절못해서 가만히 있기가 힘들었다",
      "쉽게 짜증이 나거나 쉽게 성을 냈다",
      "마치 끔찍한 일이 생길 것처럼 두렵게 느꼈다",
    ],
    bands: [
      { from: 0, to: 4, label: "정상 범위" },
      { from: 5, to: 9, label: "가벼운 불안" },
      { from: 10, to: 14, label: "중간 정도 불안" },
      { from: 15, to: 21, label: "심한 불안" },
    ],
  },
} as const;

export type AssessmentType = keyof typeof ASSESSMENTS;

export const bandOf = (type: AssessmentType, score: number) =>
  ASSESSMENTS[type].bands.find((b) => score >= b.from && score <= b.to)?.label ?? "";
