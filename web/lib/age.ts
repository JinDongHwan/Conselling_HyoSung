// 나이 정책 — 가입 화면(브라우저)과 서버에서 똑같이 쓴다.
// 개인 가입은 만 19세 이상. 만 19세 미만은 학교·기관 코드로만 가입하고, 만 14세 미만은 보호자 동의가 필요하다.
// TODO(법률 검토): 연령 구간별 동의 요건과 보호자 동의 확인 방법

export type AgeBand = "under14" | "teen" | "adult";

export const AGE_BAND_LABEL: Record<AgeBand, string> = {
  under14: "만 14세 미만",
  teen: "만 14~18세",
  adult: "만 19세 이상",
};

export const MIN_AGE = 7; // 초등학생부터 (이보다 어린 생년월일은 입력 실수로 본다)

// 만 나이: 생일이 지나야 한 살을 더한다. birthDate는 "YYYY-MM-DD"
export function ageOn(birthDate: string, today: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null; // 2월 30일 같은 날짜
  // 한국 날짜 기준으로 계산
  const kst = new Date(today.getTime() + 9 * 3_600_000);
  const [ty, tm, td] = [kst.getUTCFullYear(), kst.getUTCMonth() + 1, kst.getUTCDate()];
  let age = ty - y;
  if (tm < mo || (tm === mo && td < d)) age -= 1;
  return age;
}

export function ageBand(age: number): AgeBand {
  if (age < 14) return "under14";
  if (age < 19) return "teen";
  return "adult";
}

export type OrgAgePolicy = { allow_minors: boolean; allow_under14: boolean } | null;

// 가입 가능 여부. 가능하면 null, 아니면 사용자에게 보여 줄 이유를 돌려준다.
export function signupBlockReason(age: number | null, org: OrgAgePolicy): string | null {
  if (age === null) return "생년월일을 정확히 입력해 주세요.";
  if (age < MIN_AGE || age > 120) return "생년월일을 다시 확인해 주세요.";
  const band = ageBand(age);
  if (band === "adult") return null;
  if (!org) return "만 19세 미만은 학교나 기관에서 받은 가입 코드가 있어야 이용할 수 있어요.";
  if (band === "teen" && !org.allow_minors) return "이 기관 코드로는 만 19세 미만이 가입할 수 없어요. 기관 담당 선생님께 문의해 주세요.";
  if (band === "under14" && !org.allow_under14) return "이 기관 코드로는 만 14세 미만이 가입할 수 없어요. 기관 담당 선생님께 문의해 주세요.";
  return null;
}

// 보호자 동의가 필요한지
export const needsGuardianConsent = (band: AgeBand) => band === "under14";

export type GuardianStatus = "requested" | "submitted" | "confirmed" | "rejected" | "withdrawn";

export const GUARDIAN_STATUS_LABEL: Record<GuardianStatus, string> = {
  requested: "보호자 동의 요청됨",
  submitted: "보호자 제출 · 확인 대기",
  confirmed: "보호자 동의 완료",
  rejected: "보호자 동의 거절",
  withdrawn: "보호자 동의 철회",
};

// 프로필의 나이 구간. 생년월일이 없던 예전 가입자는 출생연도로 계산한다 (예전에는 만 19세 이상만 가입 가능했음)
export function profileAgeBand(p: { birth_date?: string | null; birth_year?: number | null }, today: Date = new Date()): AgeBand | null {
  if (p.birth_date) {
    const age = ageOn(p.birth_date, today);
    return age === null ? null : ageBand(age);
  }
  if (p.birth_year) return today.getFullYear() - p.birth_year >= 20 ? "adult" : null;
  return null;
}
