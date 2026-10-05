import Link from "next/link";
import { Logo } from "@/components/Logo";
import { PasswordForm } from "@/components/PasswordForm";
import { getCurrentProfile } from "@/lib/auth";

// 비밀번호 재설정 메일의 링크 → /auth/callback (로그인 처리) → 이 화면에서 새 비밀번호 입력
export default async function ResetPasswordPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">새 비밀번호 정하기</h1>
        {profile ? (
          <>
            <p className="mt-2 mb-6 text-sm text-muted">{profile.email ?? "내 계정"}의 새 비밀번호를 입력해 주세요.</p>
            <PasswordForm redirectTo="/dashboard" submitLabel="비밀번호 바꾸고 시작하기" />
          </>
        ) : (
          <div className="mt-3 space-y-4 text-sm">
            <p className="text-muted">재설정 링크가 만료됐거나 이미 사용됐어요. 로그인 화면에서 재설정 메일을 다시 받아 주세요.</p>
            <Link href="/login?mode=reset" className="inline-block rounded-xl bg-brand px-5 py-2.5 font-semibold text-white">
              재설정 메일 다시 받기
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
