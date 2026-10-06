import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import { DEMO_MODE, hasServiceRole } from "./config";
import { createClient, createServiceClient } from "./supabase/server";
import type { GuardianConsent, InviteCode, Organization } from "./types";

// 기관·가입 코드·보호자 동의 데이터 접근. 가입 코드와 보호자 제출은 로그인 전/다른 사용자 데이터라 서비스 키로 다룬다.

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0 O 1 I 제외
export const makeInviteCode = () => Array.from({ length: 8 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
export const makeConsentToken = () => randomBytes(24).toString("base64url");
export const normalizeCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

export type CodeCheck = { ok: true; code: InviteCode; org: Organization } | { ok: false; reason: string };

// 가입 코드 확인: 사용 중인 코드인지, 기간·인원이 남았는지, 기관이 운영 중인지
export async function checkInviteCode(raw: string): Promise<CodeCheck> {
  const code = normalizeCode(raw);
  if (!code) return { ok: false, reason: "가입 코드를 입력해 주세요." };
  if (DEMO_MODE || !hasServiceRole) return { ok: false, reason: "지금은 기관 코드를 확인할 수 없어요." };
  const db = createServiceClient();
  const { data } = await db.from("org_invite_codes").select("*, organizations(*)").eq("code", code).single();
  const row = data as (InviteCode & { organizations: Organization | null }) | null;
  if (!row || !row.active || !row.organizations?.active) return { ok: false, reason: "사용할 수 없는 가입 코드예요. 코드를 다시 확인해 주세요." };
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: "기간이 지난 가입 코드예요. 담당 선생님께 새 코드를 받아 주세요." };
  if (row.max_uses !== null && row.used_count >= row.max_uses) return { ok: false, reason: "가입 인원이 모두 찬 코드예요. 담당 선생님께 문의해 주세요." };
  const { organizations: org, ...invite } = row;
  return { ok: true, code: invite, org };
}

export async function consumeInviteCode(code: string) {
  const db = createServiceClient();
  const { data } = await db.from("org_invite_codes").select("used_count").eq("code", code).single();
  await db.from("org_invite_codes").update({ used_count: (data?.used_count ?? 0) + 1 }).eq("code", code);
}

export async function getOrg(id: string | null | undefined): Promise<Organization | null> {
  if (!id || DEMO_MODE) return null;
  const supabase = await createClient(); // RLS: 본인 소속 기관 또는 관리자만
  const { data } = await supabase.from("organizations").select("*").eq("id", id).single();
  return (data as Organization) ?? null;
}

// 가장 최근 보호자 동의 요청
export async function latestGuardianConsent(userId: string): Promise<GuardianConsent | null> {
  if (DEMO_MODE) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("guardian_consents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as GuardianConsent) ?? null;
}

// 보호자 동의 링크로 들어온 경우 (로그인 없음)
export async function guardianConsentByToken(token: string) {
  if (DEMO_MODE || !hasServiceRole || !token) return null;
  const db = createServiceClient();
  const { data } = await db.from("guardian_consents").select("*").eq("token", token).single();
  const consent = data as GuardianConsent | null;
  if (!consent) return null;
  const { data: p } = await db.from("profiles").select("nickname, org_id").eq("id", consent.user_id).single();
  let orgName: string | null = null;
  if (p?.org_id) {
    const { data: o } = await db.from("organizations").select("name").eq("id", p.org_id).single();
    orgName = o?.name ?? null;
  }
  return { consent, studentName: (p?.nickname as string | null) ?? null, orgName };
}

// ───────── 관리자용 목록 ─────────

export async function listOrgs(): Promise<(Organization & { member_count: number; codes: InviteCode[] })[]> {
  if (DEMO_MODE) return [];
  const supabase = await createClient();
  const [{ data: orgs }, { data: codes }, { data: members }] = await Promise.all([
    supabase.from("organizations").select("*").order("created_at", { ascending: false }),
    supabase.from("org_invite_codes").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("org_id").not("org_id", "is", null),
  ]);
  const count = new Map<string, number>();
  for (const m of members ?? []) count.set(m.org_id as string, (count.get(m.org_id as string) ?? 0) + 1);
  return ((orgs ?? []) as Organization[]).map((o) => ({
    ...o,
    member_count: count.get(o.id) ?? 0,
    codes: ((codes ?? []) as InviteCode[]).filter((c) => c.org_id === o.id),
  }));
}

export type GuardianConsentRow = GuardianConsent & { nickname: string | null; org_name: string | null };

export async function listGuardianConsents(): Promise<GuardianConsentRow[]> {
  if (DEMO_MODE) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("guardian_consents")
    .select("*, profiles!guardian_consents_user_id_fkey(nickname, organizations(name))")
    .order("created_at", { ascending: false })
    .limit(300);
  type Row = GuardianConsent & { profiles: { nickname: string | null; organizations: { name: string } | null } | null };
  return ((data ?? []) as Row[]).map(({ profiles, ...c }) => ({
    ...c,
    nickname: profiles?.nickname ?? null,
    org_name: profiles?.organizations?.name ?? null,
  }));
}
