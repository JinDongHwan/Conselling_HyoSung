"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { POLICY_VERSION } from "@/lib/company";
import { DEMO_MODE, hasServiceRole } from "@/lib/config";
import { makeInviteCode } from "@/lib/orgs";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// 관리자: 기관·가입 코드·보호자 동의 관리. 모든 작업은 관리 기록에 남긴다.

type Result = { ok?: true; error?: string };
const ORG_TYPES = ["office_of_education", "school", "youth_center", "company", "university", "public", "other"];
const DEMO_ERROR = { error: "데모 모드에서는 사용할 수 없어요." };

async function audit(adminId: string, action: string, targetId: string) {
  const supabase = await createClient();
  await supabase.from("admin_audit_logs").insert({ admin_id: adminId, action, target_id: targetId });
}

export async function createOrg(formData: FormData): Promise<Result> {
  const admin = await requireAdmin();
  if (DEMO_MODE) return DEMO_ERROR;
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const type = String(formData.get("type") ?? "");
  if (!name || !ORG_TYPES.includes(type)) return { error: "기관 이름과 종류를 입력해 주세요." };
  const allowUnder14 = formData.get("allow_under14") === "on";
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      type,
      parent_id: String(formData.get("parent_id") ?? "") || null,
      allow_minors: allowUnder14 || formData.get("allow_minors") === "on", // 14세 미만을 받으면 14~18세도 받는다
      allow_under14: allowUnder14,
    })
    .select("id")
    .single();
  if (error || !data) return { error: `기관을 만들지 못했어요. (${error?.message})` };
  await audit(admin.id, "create_org", data.id);
  revalidatePath("/admin/orgs");
  return { ok: true };
}

export async function updateOrg(orgId: string, patch: { active?: boolean; allow_minors?: boolean; allow_under14?: boolean }): Promise<Result> {
  const admin = await requireAdmin();
  if (DEMO_MODE) return DEMO_ERROR;
  const next = { ...patch };
  if (next.allow_under14) next.allow_minors = true;
  if (next.allow_minors === false) next.allow_under14 = false;
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update(next).eq("id", orgId);
  if (error) return { error: `바꾸지 못했어요. (${error.message})` };
  await audit(admin.id, "update_org", orgId);
  revalidatePath("/admin/orgs");
  return { ok: true };
}

export async function createInviteCode(orgId: string, formData: FormData): Promise<Result> {
  const admin = await requireAdmin();
  if (DEMO_MODE) return DEMO_ERROR;
  const days = Number(formData.get("days") ?? 0);
  const maxUses = Number(formData.get("max_uses") ?? 0);
  const supabase = await createClient();
  // 코드가 겹치면 다시 만든다
  for (let i = 0; i < 3; i++) {
    const { error } = await supabase.from("org_invite_codes").insert({
      code: makeInviteCode(),
      org_id: orgId,
      label: String(formData.get("label") ?? "").trim().slice(0, 40) || null,
      expires_at: days > 0 ? new Date(Date.now() + days * 86_400_000).toISOString() : null,
      max_uses: maxUses > 0 ? maxUses : null,
    });
    if (!error) {
      await audit(admin.id, "create_invite_code", orgId);
      revalidatePath("/admin/orgs");
      return { ok: true };
    }
    if (error.code !== "23505") return { error: `코드를 만들지 못했어요. (${error.message})` };
  }
  return { error: "코드를 만들지 못했어요. 다시 시도해 주세요." };
}

export async function setInviteCodeActive(code: string, active: boolean): Promise<Result> {
  await requireAdmin();
  if (DEMO_MODE) return DEMO_ERROR;
  const supabase = await createClient();
  const { error } = await supabase.from("org_invite_codes").update({ active }).eq("code", code);
  if (error) return { error: error.message };
  revalidatePath("/admin/orgs");
  return { ok: true };
}

// ───────── 보호자 동의 ─────────
// TODO(법률 검토): 온라인 제출 건의 확인 방법(전화 확인 등)과 서면 동의서 보관 기간

export async function decideGuardianConsent(consentId: string, decision: "confirmed" | "rejected" | "withdrawn", memo: string): Promise<Result> {
  const admin = await requireAdmin();
  if (DEMO_MODE || !hasServiceRole) return DEMO_ERROR;
  const db = createServiceClient();
  const { data: c } = await db.from("guardian_consents").select("id, user_id, status").eq("id", consentId).single();
  if (!c) return { error: "동의 요청을 찾을 수 없어요." };
  if (decision === "confirmed" && c.status !== "submitted") return { error: "보호자가 제출한 요청만 확인 완료할 수 있어요. 서면 동의서는 '서면 동의 확인'을 써 주세요." };
  const { error } = await db
    .from("guardian_consents")
    .update({
      status: decision,
      memo: memo.slice(0, 300) || null,
      confirmed_at: decision === "confirmed" ? new Date().toISOString() : null,
      confirmed_by: admin.id,
      token: null, // 처리가 끝나면 링크는 더 쓸 수 없다
    })
    .eq("id", consentId);
  if (error) return { error: error.message };
  await audit(admin.id, `guardian:${decision}`, c.user_id);
  revalidatePath("/admin/consents");
  return { ok: true };
}

// 학교에서 받은 서면 동의서를 확인한 경우
export async function recordPaperConsent(userId: string, formData: FormData): Promise<Result> {
  const admin = await requireAdmin();
  if (DEMO_MODE || !hasServiceRole) return DEMO_ERROR;
  const name = String(formData.get("guardian_name") ?? "").trim().slice(0, 30);
  const relation = String(formData.get("guardian_relation") ?? "").trim().slice(0, 20);
  if (!name || !relation) return { error: "보호자 이름과 관계를 입력해 주세요." };
  const now = new Date().toISOString();
  const { error } = await createServiceClient().from("guardian_consents").insert({
    user_id: userId,
    status: "confirmed",
    method: "paper",
    guardian_name: name,
    guardian_relation: relation,
    policy_version: POLICY_VERSION,
    submitted_at: now,
    confirmed_at: now,
    confirmed_by: admin.id,
    memo: String(formData.get("memo") ?? "").trim().slice(0, 300) || null,
  });
  if (error) return { error: error.message };
  await audit(admin.id, "guardian:paper", userId);
  revalidatePath("/admin/consents");
  revalidatePath(`/admin/users/${userId}`);
  return { ok: true };
}
