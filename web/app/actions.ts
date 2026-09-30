"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile, requireAdmin, requireProfile } from "@/lib/auth";
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
  if (!birthYear || thisYear - birthYear < 19 || formData.get("agree") !== "on") {
    redirect("/onboarding?error=1");
  }
  if (!DEMO_MODE) {
    const supabase = await createClient();
    await supabase
      .from("profiles")
      .update({
        birth_year: birthYear,
        nickname: String(formData.get("nickname") ?? "").slice(0, 20) || profile.nickname,
        consent_admin_view: formData.get("consent_admin_view") === "on",
      })
      .eq("id", profile.id);
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

export async function setUserRole(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const role = formData.get("role") === "admin" ? "admin" : "user";
  if (!DEMO_MODE && hasServiceRole) {
    await createServiceClient().from("profiles").update({ role }).eq("id", id);
  }
  revalidatePath("/admin/users");
}
