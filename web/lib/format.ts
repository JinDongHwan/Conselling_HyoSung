const tz = "Asia/Seoul";

export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "long", day: "numeric", weekday: "short" }).format(new Date(iso));

export const fmtShort = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "numeric", day: "numeric" }).format(new Date(iso)).replace(/\.\s?/g, "/").replace(/\/$/, "");

export const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("ko-KR", { timeZone: tz, month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

// 오늘을 마지막으로 하는 n일치 날짜 라벨
export const lastDayLabels = (n: number) =>
  Array.from({ length: n }, (_, i) => fmtShort(new Date(Date.now() - (n - 1 - i) * 86_400_000).toISOString()));

export const withinDays = (iso: string, days: number) => Date.now() - new Date(iso).getTime() < days * 86_400_000;

export const RISK_LABEL = { low: "안정", mid: "주의", high: "위기" } as const;

export function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", hour12: false }).format(new Date()));
  if (h < 5) return "늦은 밤이에요";
  if (h < 11) return "좋은 아침이에요";
  if (h < 17) return "오후도 잘 보내고 있나요";
  return "오늘 하루 수고 많았어요";
}

export const PROVIDER_LABEL: Record<string, string> = { email: "이메일", kakao: "카카오" };

// 관리 기록(admin_audit_logs.action)을 사람이 읽는 말로
export function auditLabel(action: string) {
  const map: Record<string, string> = {
    "set_role:admin": "관리자로 지정",
    "set_role:user": "일반 사용자로 변경",
    suspend_user: "이용 정지",
    unsuspend_user: "정지 해제",
    delete_user: "계정 삭제",
    issue_temp_password: "임시 비밀번호 발급",
    view_messages: "대화 원문 열람",
    "guardian:confirmed": "보호자 동의 확인",
    "guardian:rejected": "보호자 동의 거절 처리",
    "guardian:withdrawn": "보호자 동의 철회 처리",
    "guardian:paper": "서면 보호자 동의서 확인",
    "guardian:new_link": "보호자 동의 링크 재발급",
    create_org: "기관 등록",
    update_org: "기관 설정 변경",
    create_invite_code: "가입 코드 발급",
  };
  if (map[action]) return map[action];
  if (action.startsWith("update_alert:")) return "위기 알림 처리";
  return action;
}

export const ORG_TYPE_LABEL: Record<string, string> = {
  office_of_education: "교육청",
  school: "학교",
  youth_center: "청소년상담복지센터",
  company: "기업",
  university: "대학",
  public: "지자체·공공기관",
  other: "기타",
};

// 날짜가 이미 지났는지 (만료 확인용)
export const isPast = (iso: string | null | undefined) => Boolean(iso && new Date(iso).getTime() < Date.now());
