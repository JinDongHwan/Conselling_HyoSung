export type Risk = "low" | "mid" | "high";

export type Profile = {
  id: string;
  email?: string | null;
  nickname: string | null;
  birth_year: number | null;
  birth_date?: string | null; // "YYYY-MM-DD" (0003_age_policy.sql)
  org_id?: string | null; // 기관 가입한 경우 소속 기관
  tone_pref: "warm" | "plain";
  role: "user" | "admin";
  consent_admin_view: boolean;
  created_at: string;
  // 약관 동의 기록 (supabase/migrations/0002_policy_consent.sql)
  policy_version?: string | null;
  terms_agreed_at?: string | null;
  privacy_agreed_at?: string | null;
  sensitive_agreed_at?: string | null;
  suspended?: boolean; // 관리자가 이용을 정지한 계정 (Supabase Auth의 banned_until로 판단)
};

// 관리자 화면용: 프로필 + 로그인 계정 정보
export type AdminUser = Profile & {
  session_count: number;
  last_risk: string;
  provider: string | null; // "email" | "kakao"
  last_sign_in_at: string | null;
  banned_until: string | null;
};

export type OrgType = "office_of_education" | "school" | "youth_center" | "company" | "university" | "public" | "other";

export type Organization = {
  id: string;
  name: string;
  type: OrgType;
  parent_id: string | null;
  allow_minors: boolean;
  allow_under14: boolean;
  active: boolean;
  created_at: string;
};

export type InviteCode = {
  code: string;
  org_id: string;
  label: string | null;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
};

export type GuardianConsent = {
  id: string;
  user_id: string;
  status: "requested" | "submitted" | "confirmed" | "rejected" | "withdrawn";
  method: "online" | "paper" | null;
  token: string | null;
  token_expires_at: string | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_contact: string | null;
  policy_version: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
  memo: string | null;
  created_at: string;
};

export type Source = { title: string; category?: string; source_url?: string };

export type Session = {
  id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  topics: string[];
  mood_start: number | null;
  mood_end: number | null;
  risk_level: Risk;
  created_at: string;
  ended_at: string | null;
};

export type Message = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  risk_flag: Risk | null;
  created_at: string;
};

export type MoodLog = { id: string; user_id: string; score: number; note: string | null; created_at: string };

export type Assessment = {
  id: string;
  user_id: string;
  type: "PHQ-9" | "GAD-7";
  score: number;
  created_at: string;
};

export type AdminAlert = {
  id: string;
  session_id: string;
  user_id: string;
  risk_level: Risk;
  status: "new" | "checked" | "resolved";
  memo: string | null;
  created_at: string;
  nickname?: string | null;
  session_title?: string | null;
};
