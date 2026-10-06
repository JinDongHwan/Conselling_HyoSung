import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { needsGuardianConsent, profileAgeBand } from "./age";
import { POLICY_VERSION } from "./company";
import { DEMO_MODE } from "./config";
import { demoProfile } from "./demo-data";
import { latestGuardianConsent } from "./orgs";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  if (DEMO_MODE) return demoProfile;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!data) return null;
  return { ...(data as Profile), email: user.email, suspended: isBanned(user.banned_until) };
});

export const isBanned = (bannedUntil?: string | null) => Boolean(bannedUntil && new Date(bannedUntil).getTime() > Date.now());

// 시작 설정(생년월일 확인 + 약관 동의)을 거쳐야 하는지.
// 약관 버전이 바뀌면 다시 동의해야 한다. DB에 해당 칸이 아직 없으면(마이그레이션 미실행) 그 확인은 건너뛴다.
export function needsOnboarding(profile: Profile) {
  if (DEMO_MODE) return false;
  if ("birth_date" in profile ? !profile.birth_date : !profile.birth_year) return true;
  return "policy_version" in profile && profile.policy_version !== POLICY_VERSION;
}

// 만 14세 미만인데 보호자 동의가 아직 확인되지 않았는지 (확인 전에는 상담 이용 불가)
export async function guardianPending(profile: Profile) {
  if (DEMO_MODE || !needsGuardianConsent(profileAgeBand(profile) ?? "adult")) return false;
  const consent = await latestGuardianConsent(profile.id);
  return consent?.status !== "confirmed";
}

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.suspended) redirect("/suspended");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
