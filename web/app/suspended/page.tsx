import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { getCurrentProfile } from "@/lib/auth";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = { title: "이용이 정지된 계정 — magic.ai" };

// 관리자가 이용을 정지한 계정이 들어오면 보이는 화면
export default async function SuspendedPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.suspended) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">이용이 정지된 계정이에요</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          이용약관에 따라 이 계정의 서비스 이용이 정지되었어요. 정지에 대해 궁금한 점이 있으면{" "}
          <a href={`mailto:${COMPANY.email}`} className="font-semibold text-ink underline">{COMPANY.email}</a>로 문의해 주세요.
        </p>
        <div className="mt-5 rounded-xl bg-danger-soft px-4 py-3 text-sm">
          지금 많이 힘들다면 자살예방 상담전화 <a href="tel:109" className="font-bold">109</a>, 정신건강 위기상담전화{" "}
          <a href="tel:15770199" className="font-bold">1577-0199</a>로 언제든 연락할 수 있어요.
        </div>
        <form action={signOut} className="mt-6">
          <button className="w-full rounded-xl border border-line px-4 py-3 font-semibold hover:border-brand">로그아웃</button>
        </form>
      </div>
    </main>
  );
}
