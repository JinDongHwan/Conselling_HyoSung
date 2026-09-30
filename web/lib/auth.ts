import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
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
  return data ? { ...(data as Profile), email: user.email } : null;
});

export async function requireProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}
