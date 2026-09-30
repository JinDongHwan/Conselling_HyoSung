// Supabase 키를 넣기 전 화면 확인용 샘플 데이터
import type { AdminAlert, Assessment, Message, MoodLog, Profile, Session } from "./types";

const DAY = 86_400_000;
const ago = (d: number, h = 21) => {
  const t = new Date(Date.now() - d * DAY);
  t.setHours(h, 12, 0, 0);
  return t.toISOString();
};

export const demoProfile: Profile = {
  id: "demo-user",
  email: null,
  nickname: "하늘",
  birth_year: 1994,
  tone_pref: "warm",
  role: "admin", // 데모에서는 관리자 화면도 볼 수 있게
  consent_admin_view: false,
  created_at: ago(40),
};

export const demoSessions: Session[] = [
  {
    id: "s1",
    user_id: "demo-user",
    title: "팀장님 피드백 후 잠이 안 와요",
    summary: "업무 피드백 이후 반복되는 자기비판과 입면 곤란. 생각 기록과 취침 전 루틴을 함께 정리함.",
    topics: ["직장", "수면", "자존감"],
    mood_start: 3,
    mood_end: 5,
    risk_level: "low",
    created_at: ago(1),
    ended_at: ago(1, 22),
  },
  {
    id: "s2",
    user_id: "demo-user",
    title: "주말 내내 아무것도 하기 싫었던 이유",
    summary: "무기력과 흥미 저하가 2주째 지속. 작은 행동 활성화 계획을 세우고 PHQ-9 검사를 권유함.",
    topics: ["우울", "무기력"],
    mood_start: 2,
    mood_end: 4,
    risk_level: "mid",
    created_at: ago(4),
    ended_at: ago(4, 22),
  },
  {
    id: "s3",
    user_id: "demo-user",
    title: "엄마와 통화 후 마음이 무거움",
    summary: "가족과의 갈등에서 오는 죄책감. 경계 설정과 감정 표현 문장을 연습함.",
    topics: ["가족", "대인관계"],
    mood_start: 4,
    mood_end: 6,
    risk_level: "low",
    created_at: ago(9),
    ended_at: ago(9, 22),
  },
  {
    id: "s4",
    user_id: "demo-user",
    title: "발표 전날 심장이 두근거려요",
    summary: "수행 불안. 4-7-8 호흡과 최악·최선·현실 시나리오 적기를 안내함.",
    topics: ["불안", "직장"],
    mood_start: 3,
    mood_end: 6,
    risk_level: "low",
    created_at: ago(15),
    ended_at: ago(15, 22),
  },
];

export const demoMessages: Record<string, Message[]> = {
  s1: [
    {
      id: "m1",
      session_id: "s1",
      role: "user",
      content: "오늘 팀장님한테 보고서 피드백을 받았는데, 계속 머릿속에서 그 말이 반복돼서 잠이 안 와요.",
      sources: [],
      risk_flag: "low",
      created_at: ago(1),
    },
    {
      id: "m2",
      session_id: "s1",
      role: "assistant",
      content:
        "피드백 한마디가 밤까지 따라오면 몸은 누워 있어도 마음은 계속 회의실에 있는 느낌이죠. 그만큼 일을 잘하고 싶은 마음이 크다는 뜻이기도 해요.\n\n지금 머릿속에서 반복되는 문장을 딱 한 줄로 적어볼 수 있을까요? 그 문장이 '사실'인지 '해석'인지 같이 나눠보면, 생각이 조금 덜 시끄러워지는 경우가 많아요.",
      sources: [{ title: "스트레스와 불면", category: "04_수면" }],
      risk_flag: null,
      created_at: ago(1),
    },
  ],
};

export const demoMoods: MoodLog[] = [6, 5, 4, 4, 3, 5, 5, 4, 3, 2, 4, 5, 6, 5].map((score, i) => ({
  id: `mood${i}`,
  user_id: "demo-user",
  score,
  note: null,
  created_at: ago(13 - i, 22),
}));

export const demoAssessments: Assessment[] = [
  { id: "a1", user_id: "demo-user", type: "PHQ-9", score: 14, created_at: ago(28) },
  { id: "a2", user_id: "demo-user", type: "PHQ-9", score: 12, created_at: ago(14) },
  { id: "a3", user_id: "demo-user", type: "PHQ-9", score: 9, created_at: ago(2) },
  { id: "a4", user_id: "demo-user", type: "GAD-7", score: 11, created_at: ago(21) },
  { id: "a5", user_id: "demo-user", type: "GAD-7", score: 8, created_at: ago(3) },
];

export const demoAlerts: AdminAlert[] = [
  {
    id: "al1",
    session_id: "x1",
    user_id: "u7",
    risk_level: "high",
    status: "new",
    memo: null,
    created_at: ago(0, 1),
    nickname: "새벽별",
    session_title: "다 그만두고 싶다는 생각이 들어요",
  },
  {
    id: "al2",
    session_id: "x2",
    user_id: "u3",
    risk_level: "high",
    status: "checked",
    memo: "109 안내 후 본인이 지역 센터 연락 예정이라고 함",
    created_at: ago(2, 23),
    nickname: "moss",
    session_title: "요즘 사라지고 싶어요",
  },
  {
    id: "al3",
    session_id: "x3",
    user_id: "u9",
    risk_level: "high",
    status: "resolved",
    memo: "정신건강복지센터 연계 완료",
    created_at: ago(6, 2),
    nickname: "지나가는 사람",
    session_title: "밤마다 숨이 막혀요",
  },
];

type DemoUser = Profile & { session_count: number; last_risk: string };
const u = (id: string, nickname: string, birth_year: number, consent: boolean, created: number, session_count: number, last_risk: string): DemoUser => ({
  id, nickname, email: null, birth_year, tone_pref: "warm", role: "user", consent_admin_view: consent, created_at: ago(created), session_count, last_risk,
});

export const demoUsers: DemoUser[] = [
  u("demo-user", "하늘", 1994, false, 40, 4, "mid"),
  u("u7", "새벽별", 1999, true, 12, 7, "high"),
  u("u3", "moss", 1988, false, 30, 11, "high"),
  u("u9", "지나가는 사람", 1979, true, 20, 3, "low"),
  u("u11", "보리", 2001, false, 5, 2, "low"),
];

export const demoDailySessions = [18, 22, 19, 25, 31, 27, 24, 29, 33, 30, 26, 35, 38, 34];

export const demoTopicCounts: { topic: string; count: number }[] = [
  { topic: "직장", count: 142 },
  { topic: "불안", count: 118 },
  { topic: "수면", count: 97 },
  { topic: "우울", count: 91 },
  { topic: "대인관계", count: 76 },
  { topic: "가족", count: 58 },
  { topic: "자존감", count: 44 },
];
