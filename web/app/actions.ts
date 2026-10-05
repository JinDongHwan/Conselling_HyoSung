"use server";

import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, requireAdmin, requireProfile } from "@/lib/auth";
import { POLICY_VERSION } from "@/lib/company";
import { DEMO_MODE, hasServiceRole } from "@/lib/config";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const clampInt = (v: FormDataEntryValue | null, min: number, max: number) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

// ───────── 사용자 ─────────

export async function saveMood(formData: FormData) {
  const profile = await requireProfile();
  const score = clampInt(formData.get("score"), 1, 10);
  if (!score || DEMO_MODE) return;
  const note = String(formData.get("note") ?? "").slice(0, 300) || null;
  const supabase = await createClient();
  await supabase.from("mood_logs").insert({ user_id: profile.id, score, note });
  revalidatePath("/dashboard");
}

export async function completeOnboarding(formData: FormData) {
  const profile = await requireProfile();
  const thisYear = new Date().getFullYear();
  const birthYear = clampInt(formData.get("birth_year"), 1900, thisYear);
  const agreedAll = ["agree_terms", "agree_privacy", "agree_sensitive"].every((k) => formData.get(k) === "on");
  if (!birthYear || thisYear - birthYear < 19 || !agreedAll) {
    redirect("/onboarding?error=1");
  }
  if (!DEMO_MODE) {
    const supabase = await createClient();
    const now = new Date().toISOString();
    const basic = {
      birth_year: birthYear,
      nickname: String(formData.get("nickname") ?? "").slice(0, 20) || profile.nickname,
      consent_admin_view: formData.get("consent_admin_view") === "on",
    };
    // 약관 동의 기록: 어떤 버전에 언제 동의했는지
    const consent = { policy_version: POLICY_VERSION, terms_agreed_at: now, privacy_agreed_at: now, sensitive_agreed_at: now };
    const { error } = await supabase.from("profiles").update({ ...basic, ...consent }).eq("id", profile.id);
    if (error) {
      // 동의 기록 칸이 아직 없으면(0002 미실행) 기본 정보만이라도 저장
      console.error("[onboarding] consent save failed:", error.code, error.message);
      await supabase.from("profiles").update(basic).eq("id", profile.id);
    }
  }
  redirect("/dashboard");
}

export async function saveProfile(formData: FormData) {
  const profile = await requireProfile();
  if (DEMO_MODE) return;
  const tone = formData.get("tone_pref") === "plain" ? "plain" : "warm";
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      nickname: String(formData.get("nickname") ?? "").slice(0, 20) || null,
      tone_pref: tone,
      consent_admin_view: formData.get("consent_admin_view") === "on",
    })
    .eq("id", profile.id);
  revalidatePath("/dashboard/mypage");
}

export async function saveAssessment(type: "PHQ-9" | "GAD-7", answers: number[]) {
  const profile = await requireProfile();
  const expected = type === "PHQ-9" ? 9 : 7;
  if (answers.length !== expected || answers.some((a) => !Number.isInteger(a) || a < 0 || a > 3)) {
    throw new Error("응답이 올바르지 않습니다.");
  }
  const score = answers.reduce((a, b) => a + b, 0);
  if (!DEMO_MODE) {
    const supabase = await createClient();
    await supabase.from("assessments").insert({ user_id: profile.id, type, score, answers });
  }
  revalidatePath("/dashboard/data");
  return { score };
}

export async function deleteSession(id: string) {
  await requireProfile();
  if (!DEMO_MODE) {
    const supabase = await createClient();
    await supabase.from("sessions").delete().eq("id", id); // RLS: 본인 것만 삭제됨
  }
  revalidatePath("/dashboard/records");
  redirect("/dashboard/records");
}

export async function deleteAccount() {
  const profile = await requireProfile();
  if (!DEMO_MODE && hasServiceRole) {
    // auth.users 삭제 → profiles 이하 모든 데이터가 cascade 로 삭제된다
    await createServiceClient().auth.admin.deleteUser(profile.id);
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function signOut() {
  if (!DEMO_MODE) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

// ───────── 관리자 ─────────

export async function updateAlert(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["new", "checked", "resolved"].includes(status)) return;
  if (!DEMO_MODE) {
    const supabase = await createClient();
    await supabase
      .from("admin_alerts")
      .update({ status, memo: String(formData.get("memo") ?? "").slice(0, 500) || null, handled_by: admin.id })
      .eq("id", id);
    await supabase.from("admin_audit_logs").insert({ admin_id: admin.id, action: `update_alert:${status}`, target_id: id });
  }
  revalidatePath("/admin/alerts");
}

export async function logAdminView(sessionId: string) {
  const admin = await getCurrentProfile();
  if (!admin || admin.role !== "admin" || DEMO_MODE) return;
  const supabase = await createClient();
  await supabase.from("admin_audit_logs").insert({ admin_id: admin.id, action: "view_messages", target_id: sessionId });
}

// ───────── 관리자: 사용자 계정 관리 ─────────
// 모든 작업은 관리 기록(admin_audit_logs)에 남긴다. 본인 계정과 다른 관리자 계정에는 위험한 작업을 막는다.

type AdminResult = { ok?: true; error?: string };

async function auditLog(adminId: string, action: string, targetId: string) {
  const supabase = await createClient();
  await supabase.from("admin_audit_logs").insert({ admin_id: adminId, action, target_id: targetId });
}

async function targetRole(userId: string) {
  const { data } = await createServiceClient().from("profiles").select("role").eq("id", userId).single();
  return data?.role as "user" | "admin" | undefined;
}

export async function adminSetRole(userId: string, role: "user" | "admin"): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (DEMO_MODE || !hasServiceRole) return { error: "데모 모드에서는 사용할 수 없어요." };
  // 본인 권한을 스스로 내리면 관리자가 한 명도 남지 않을 수 있어서 막는다
  if (userId === admin.id) return { error: "본인 권한은 바꿀 수 없어요. 다른 관리자에게 요청해 주세요." };
  const { error } = await createServiceClient().from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: `권한을 바꾸지 못했어요. (${error.message})` };
  await auditLog(admin.id, `set_role:${role}`, userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

// 이용 정지: Supabase Auth의 ban 기능으로 로그인 자체를 막는다 (해제하면 다시 로그인 가능)
export async function adminSetSuspended(userId: string, suspend: boolean): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (DEMO_MODE || !hasServiceRole) return { error: "데모 모드에서는 사용할 수 없어요." };
  if (userId === admin.id) return { error: "본인 계정은 정지할 수 없어요." };
  if (suspend && (await targetRole(userId)) === "admin") return { error: "관리자 계정은 정지할 수 없어요. 먼저 권한을 사용자로 바꿔 주세요." };
  const { error } = await createServiceClient().auth.admin.updateUserById(userId, { ban_duration: suspend ? "876000h" : "none" });
  if (error) return { error: `${suspend ? "정지" : "정지 해제"}하지 못했어요. (${error.message})` };
  await auditLog(admin.id, suspend ? "suspend_user" : "unsuspend_user", userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

// 계정 삭제: 계정과 모든 상담·기분·자가진단 기록이 함께 삭제된다 (되돌릴 수 없음)
export async function adminDeleteUser(userId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  if (DEMO_MODE || !hasServiceRole) return { error: "데모 모드에서는 사용할 수 없어요." };
  if (userId === admin.id) return { error: "본인 계정은 마이페이지의 탈퇴하기로 삭제해 주세요." };
  if ((await targetRole(userId)) === "admin") return { error: "관리자 계정은 삭제할 수 없어요. 먼저 권한을 사용자로 바꿔 주세요." };
  const { error } = await createServiceClient().auth.admin.deleteUser(userId);
  if (error) return { error: `삭제하지 못했어요. (${error.message})` };
  await auditLog(admin.id, "delete_user", userId);
  revalidatePath("/admin/users");
  return { ok: true };
}

// 관리자: 비밀번호를 잊은 사용자에게 임시 비밀번호 발급 (화면에 한 번만 보여 주고 저장하지 않음)
const TEMP_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"; // 헷갈리는 0 O 1 l I 제외

function makeTempPassword() {
  const pick = (n: number) => Array.from({ length: n }, () => TEMP_ALPHABET[randomInt(TEMP_ALPHABET.length)]).join("");
  // 영문·숫자가 반드시 섞이도록 마지막에 숫자 2개를 붙인다 (예: Kp7wRt-mQ3xZn-48)
  return `${pick(6)}-${pick(6)}-${randomInt(10, 100)}`;
}

export async function adminIssueTempPassword(userId: string): Promise<{ password?: string; error?: string }> {
  const admin = await requireAdmin();
  if (DEMO_MODE || !hasServiceRole) return { error: "데모 모드에서는 사용할 수 없어요." };
  if (userId === admin.id) return { error: "본인 비밀번호는 마이페이지에서 바꿔 주세요." };

  const password = makeTempPassword();
  const { error } = await createServiceClient().auth.admin.updateUserById(userId, { password });
  if (error) return { error: `임시 비밀번호를 만들지 못했어요. (${error.message})` };

  await auditLog(admin.id, "issue_temp_password", userId);
  return { password };
}
