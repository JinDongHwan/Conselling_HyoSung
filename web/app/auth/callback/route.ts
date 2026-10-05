import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 카카오 로그인·이메일 인증 후 돌아오는 곳
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }
  // 정지된 계정이면 Supabase가 code 대신 오류 설명을 보낸다
  const banned = (searchParams.get("error_description") ?? "").toLowerCase().includes("banned");
  return NextResponse.redirect(`${origin}/login?error=${banned ? "banned" : "auth"}`);
}
