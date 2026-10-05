import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { POLICY_VERSION } from "./company";
import { DEMO_MODE } from "./config";
import { demoProfile } from "./demo-data";
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

// 시작 설정(출생연도 확인 + 약관 동의)을 거쳐야 하는지.
// 약관 버전이 바뀌면 다시 동의해야 한다. DB에 동의 기록 칸이 아직 없으면(0002 미실행) 버전 확인은 건너뛴다.
export function needsOnboarding(profile: Profile) {
  if (DEMO_MODE) return false;
  if (!profile.birth_year) return true;
  return "policy_version" in profile && profile.policy_version !== POLICY_VERSION;
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
