export type Risk = "low" | "mid" | "high";

export type Profile = {
  id: string;
  email?: string | null;
  nickname: string | null;
  birth_year: number | null;
  tone_pref: "warm" | "plain";
  role: "user" | "admin";
  consent_admin_view: boolean;
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
