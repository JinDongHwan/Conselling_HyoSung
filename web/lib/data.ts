import "server-only";
import { DEMO_MODE, hasServiceRole } from "./config";
import * as demo from "./demo-data";
import { createClient, createServiceClient } from "./supabase/server";
import type { AdminAlert, AdminUser, Assessment, Message, MoodLog, Profile, Session } from "./types";

// ───────── 사용자 ─────────

export async function listSessions(userId: string, limit = 50): Promise<Session[]> {
  if (DEMO_MODE) return demo.demoSessions.slice(0, limit);
  const supabase = await createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Session[];
}

export async function getSession(id: string): Promise<{ session: Session; messages: Message[] } | null> {
  if (DEMO_MODE) {
    const session = demo.demoSessions.find((s) => s.id === id);
    return session ? { session, messages: demo.demoMessages[id] ?? [] } : null;
  }
  const supabase = await createClient();
  const { data: session } = await supabase.from("sessions").select("*").eq("id", id).single();
  if (!session) return null;
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at");
  return { session: session as Session, messages: (messages ?? []) as Message[] };
}

export async function listMoods(userId: string, days = 30): Promise<MoodLog[]> {
  if (DEMO_MODE) return demo.demoMoods;
  const supabase = await createClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data } = await supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at");
  return (data ?? []) as MoodLog[];
}

export async function listAssessments(userId: string): Promise<Assessment[]> {
  if (DEMO_MODE) return demo.demoAssessments;
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("id,user_id,type,score,created_at")
    .eq("user_id", userId)
    .order("created_at");
  return (data ?? []) as Assessment[];
}

export function countTopics(sessions: Pick<Session, "topics">[]) {
  const counts = new Map<string, number>();
  for (const s of sessions) for (const t of s.topics ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);
}

// ───────── 관리자 (RLS가 admin 권한을 확인) ─────────

export async function adminOverview() {
  if (DEMO_MODE) {
    return {
      users: 1284,
      sessionsToday: demo.demoDailySessions.at(-1)!,
      openAlerts: demo.demoAlerts.filter((a) => a.status !== "resolved").length,
      avgMood: 4.6,
      daily: demo.demoDailySessions,
      risk: { low: 412, mid: 61, high: 9 },
    };
  }
  const supabase = await createClient();
  const since14 = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const [users, sessions, alerts, moods] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("sessions").select("created_at,risk_level").gte("created_at", since14),
    supabase.from("admin_alerts").select("id", { count: "exact", head: true }).neq("status", "resolved"),
    supabase.from("mood_logs").select("score").gte("created_at", since14),
  ]);
  const rows = (sessions.data ?? []) as { created_at: string; risk_level: string }[];
  const daily = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * 86_400_000).toDateString();
    return rows.filter((r) => new Date(r.created_at).toDateString() === day).length;
  });
  const risk = { low: 0, mid: 0, high: 0 };
  rows.forEach((r) => (risk[r.risk_level as keyof typeof risk] += 1));
  const scores = (moods.data ?? []).map((m) => m.score as number);
  return {
    users: users.count ?? 0,
    sessionsToday: daily.at(-1) ?? 0,
    openAlerts: alerts.count ?? 0,
    avgMood: scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0,
    daily,
    risk,
  };
}

export async function listAlerts(): Promise<AdminAlert[]> {
  if (DEMO_MODE) return demo.demoAlerts;
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_alerts")
    .select("*, profiles:user_id(nickname), sessions:session_id(title)")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []).map((a) => ({
    ...(a as AdminAlert),
    nickname: (a as { profiles?: { nickname: string | null } }).profiles?.nickname,
    session_title: (a as { sessions?: { title: string | null } }).sessions?.title,
  }));
}

// 로그인 계정 정보(이메일·가입 방식·마지막 로그인·정지 여부)는 auth.users 에만 있어서 서버 전용 키로 읽는다 (관리자 화면에서만 사용)
type AuthInfo = Pick<AdminUser, "email" | "provider" | "last_sign_in_at" | "banned_until">;

function toAuthInfo(u: { email?: string; app_metadata?: { provider?: string }; last_sign_in_at?: string; banned_until?: string }): AuthInfo {
  return {
    email: u.email ?? null,
    provider: u.app_metadata?.provider ?? null,
    last_sign_in_at: u.last_sign_in_at ?? null,
    banned_until: u.banned_until ?? null,
  };
}

const NO_AUTH: AuthInfo = { email: null, provider: null, last_sign_in_at: null, banned_until: null };

export async function listUsers(): Promise<AdminUser[]> {
  if (DEMO_MODE) return demo.demoUsers.map((d) => ({ ...NO_AUTH, provider: "email", ...d }));
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, sessions(risk_level, created_at)")
    .order("created_at", { ascending: false })
    .limit(1000);
  const auth = new Map<string, AuthInfo>();
  if (hasServiceRole) {
    const { data: au } = await createServiceClient().auth.admin.listUsers({ perPage: 1000 });
    for (const u of au?.users ?? []) auth.set(u.id, toAuthInfo(u));
  }
  return (data ?? []).map((p) => {
    const sessions = ((p as { sessions?: { risk_level: string; created_at: string }[] }).sessions ?? []).sort(
      (a, b) => b.created_at.localeCompare(a.created_at),
    );
    const profile = p as Profile;
    return { ...profile, ...(auth.get(profile.id) ?? NO_AUTH), session_count: sessions.length, last_risk: sessions[0]?.risk_level ?? "-" };
  });
}

export type AuditEntry = { id: number; action: string; created_at: string; admin_name: string | null };

// 관리자: 사용자 한 명의 상세 (기본 정보 + 상담·기분·자가진단 + 이 사용자에 대한 관리 기록)
export async function getUserDetail(id: string) {
  if (DEMO_MODE) {
    const d = demo.demoUsers.find((x) => x.id === id);
    if (!d) return null;
    const user: AdminUser = { ...NO_AUTH, provider: "email", ...d };
    return { user, sessions: demo.demoSessions, moods: demo.demoMoods, assessments: demo.demoAssessments, audit: [] as AuditEntry[] };
  }
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!profile) return null;

  let authInfo = NO_AUTH;
  if (hasServiceRole) {
    const { data } = await createServiceClient().auth.admin.getUserById(id);
    if (data.user) authInfo = toAuthInfo(data.user);
  }

  const [sessions, moods, assessments, logs] = await Promise.all([
    listSessions(id, 100),
    listMoods(id, 90),
    listAssessments(id),
    supabase.from("admin_audit_logs").select("id, action, created_at, admin_id").eq("target_id", id).order("created_at", { ascending: false }).limit(30),
  ]);

  // 관리 기록에 관리자 이름 붙이기
  const adminIds = [...new Set((logs.data ?? []).map((l) => l.admin_id as string))];
  const names = new Map<string, string | null>();
  if (adminIds.length) {
    const { data: admins } = await supabase.from("profiles").select("id, nickname").in("id", adminIds);
    for (const a of admins ?? []) names.set(a.id, a.nickname);
  }
  const audit: AuditEntry[] = (logs.data ?? []).map((l) => ({
    id: l.id,
    action: l.action,
    created_at: l.created_at,
    admin_name: names.get(l.admin_id) ?? null,
  }));

  const last = sessions[0];
  const user: AdminUser = { ...(profile as Profile), ...authInfo, session_count: sessions.length, last_risk: last?.risk_level ?? "-" };
  return { user, sessions, moods, assessments, audit };
}

export async function adminTopicCounts() {
  if (DEMO_MODE) return demo.demoTopicCounts;
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await supabase.from("sessions").select("topics").gte("created_at", since);
  return countTopics((data ?? []) as Pick<Session, "topics">[]);
}

export async function listKnowledgeFiles(): Promise<{ file: string; title: string; category: string; chunks: number }[]> {
  if (DEMO_MODE) {
    return [
      { file: "99_위기대응·기관안내/crisis.md", title: "위기 상황 도움받을 수 있는 곳", category: "99_위기대응·기관안내", chunks: 4 },
    ];
  }
  const supabase = await createClient();
  const { data } = await supabase.from("documents").select("metadata").limit(5000);
  const files = new Map<string, { file: string; title: string; category: string; chunks: number }>();
  for (const row of data ?? []) {
    const m = row.metadata as { file: string; title: string; category: string };
    const f = files.get(m.file) ?? { file: m.file, title: m.title, category: m.category, chunks: 0 };
    f.chunks += 1;
    files.set(m.file, f);
  }
  return [...files.values()].sort((a, b) => a.file.localeCompare(b.file));
}
