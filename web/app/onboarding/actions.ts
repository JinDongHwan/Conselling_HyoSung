"use server";

import { redirect } from "next/navigation";
import { ageBand, ageOn, needsGuardianConsent, signupBlockReason, type OrgAgePolicy } from "@/lib/age";
import { requireProfile } from "@/lib/auth";
import { POLICY_VERSION } from "@/lib/company";
import { DEMO_MODE, hasServiceRole } from "@/lib/config";
import { checkInviteCode, getOrg, guardianConsentByToken, latestGuardianConsent, makeConsentToken, consumeInviteCode } from "@/lib/orgs";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

const GUARDIAN_LINK_DAYS = 14;

// 보호자 동의 요청을 새로 만든다 (링크 토큰 포함)
async function createGuardianRequest(userId: string) {
  const db = hasServiceRole ? createServiceClient() : await createClient();
  await db.from("guardian_consents").insert({
    user_id: userId,
    status: "requested",
    token: makeConsentToken(),
    token_expires_at: new Date(Date.now() + GUARDIAN_LINK_DAYS * 86_400_000).toISOString(),
  });
}

// 시작 설정: 생년월일·기관 코드로 나이 정책을 확인하고, 연령에 맞는 동의를 기록한다
export async function completeOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const birthDate = String(formData.get("birth_date") ?? "");
  const rawCode = String(formData.get("org_code") ?? "").trim();
  const age = ageOn(birthDate);

  // 기관: 새 코드를 입력했으면 확인하고, 아니면 이미 소속된 기관을 그대로 쓴다
  let orgId = profile.org_id ?? null;
  let policy: OrgAgePolicy = null;
  let newCode: string | null = null;
  if (rawCode) {
    const check = await checkInviteCode(rawCode);
    if (!check.ok) return { error: check.reason };
    orgId = check.org.id;
    policy = check.org;
    newCode = check.code.code;
  } else if (orgId) {
    policy = await getOrg(orgId);
  }

  const blocked = signupBlockReason(age, policy);
  if (blocked) return { error: blocked };
  const agreed = ["agree_terms", "agree_privacy", "agree_sensitive"].every((k) => formData.get(k) === "on");
  if (!agreed) return { error: "필수 항목에 모두 동의해야 시작할 수 있어요." };

  const band = ageBand(age!);
  if (!DEMO_MODE) {
    // 생년월일·기관·동의 기록은 서버에서 검증한 값만 서비스 키로 저장한다 (사용자가 직접 바꿀 수 없음)
    const db = hasServiceRole ? createServiceClient() : await createClient();
    const now = new Date().toISOString();
    const { error } = await db
      .from("profiles")
      .update({
        nickname: String(formData.get("nickname") ?? "").slice(0, 20) || profile.nickname,
        birth_date: birthDate,
        birth_year: Number(birthDate.slice(0, 4)),
        org_id: orgId,
        // 만 19세 미만은 관리자 원문 열람 동의를 받지 않는다 (위기 상황 열람은 정책에 따름)
        consent_admin_view: band === "adult" && formData.get("consent_admin_view") === "on",
        policy_version: POLICY_VERSION,
        terms_agreed_at: now,
        privacy_agreed_at: now,
        sensitive_agreed_at: now,
      })
      .eq("id", profile.id);
    if (error) {
      console.error("[onboarding] save failed:", error.code, error.message);
      return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };
    }
    if (newCode) await consumeInviteCode(newCode);

    if (needsGuardianConsent(band)) {
      const latest = await latestGuardianConsent(profile.id);
      if (!latest || latest.status === "rejected" || latest.status === "withdrawn") await createGuardianRequest(profile.id);
      redirect("/onboarding/guardian");
    }
  }
  redirect("/dashboard");
}

// 학생: 보호자 동의 링크를 새로 받기 (만료·거절된 경우)
export async function renewGuardianLink(): Promise<FormState> {
  const profile = await requireProfile();
  if (DEMO_MODE) return { error: "데모 모드에서는 사용할 수 없어요." };
  const latest = await latestGuardianConsent(profile.id);
  if (latest?.status === "confirmed") return { error: "이미 보호자 동의가 완료됐어요." };
  if (latest?.status === "submitted") return { error: "보호자가 이미 제출했어요. 확인이 끝날 때까지 기다려 주세요." };
  if (latest && hasServiceRole) {
    await createServiceClient()
      .from("guardian_consents")
      .update({ token: makeConsentToken(), token_expires_at: new Date(Date.now() + GUARDIAN_LINK_DAYS * 86_400_000).toISOString(), status: "requested" })
      .eq("id", latest.id);
  } else {
    await createGuardianRequest(profile.id);
  }
  return { ok: true };
}

// 보호자: 링크에서 동의서 제출 (로그인 없음). 제출 후 운영자가 확인해야 완료된다.
// TODO(법률 검토): 법정대리인 동의 확인 방법 — 현재는 제출 정보로 운영자가 확인(전화 등)하는 방식. 휴대폰 본인인증·문자 확인 연동 검토.
export async function submitGuardianConsent(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const found = await guardianConsentByToken(token);
  if (!found) return { error: "유효하지 않은 링크예요. 자녀에게 새 링크를 받아 주세요." };
  const { consent } = found;
  if (consent.status !== "requested") return { error: "이미 처리된 동의 요청이에요." };
  if (consent.token_expires_at && new Date(consent.token_expires_at).getTime() < Date.now())
    return { error: "링크 기간이 지났어요. 자녀에게 새 링크를 받아 주세요." };

  const name = String(formData.get("guardian_name") ?? "").trim().slice(0, 30);
  const relation = String(formData.get("guardian_relation") ?? "").trim().slice(0, 20);
  const contact = String(formData.get("guardian_contact") ?? "").trim().slice(0, 60);
  if (!name || !relation || !contact) return { error: "이름, 관계, 연락처를 모두 적어 주세요." };
  const agreed = ["agree_terms", "agree_privacy", "agree_sensitive"].every((k) => formData.get(k) === "on");
  if (!agreed) return { error: "필수 항목에 모두 동의해야 제출할 수 있어요." };

  const { error } = await createServiceClient()
    .from("guardian_consents")
    .update({
      status: "submitted",
      method: "online",
      guardian_name: name,
      guardian_relation: relation,
      guardian_contact: contact,
      policy_version: POLICY_VERSION,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", consent.id)
    .eq("status", "requested");
  if (error) return { error: "제출하지 못했어요. 잠시 후 다시 시도해 주세요." };
  return { ok: true };
}
