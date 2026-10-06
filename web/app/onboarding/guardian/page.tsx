import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { GUARDIAN_STATUS_LABEL, needsGuardianConsent, profileAgeBand } from "@/lib/age";
import { needsOnboarding, requireProfile } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";
import { fmtDate, isPast } from "@/lib/format";
import { getOrg, latestGuardianConsent } from "@/lib/orgs";
import { GuardianLinkBox } from "./GuardianLinkBox";

// 만 14세 미만 학생: 보호자 동의를 기다리는 화면. 동의가 확인되면 상담을 시작할 수 있다.
export default async function GuardianWaitPage() {
  const profile = await requireProfile();
  if (DEMO_MODE) redirect("/dashboard");
  if (needsOnboarding(profile)) redirect("/onboarding");
  if (!needsGuardianConsent(profileAgeBand(profile) ?? "adult")) redirect("/dashboard");

  const [consent, org] = await Promise.all([latestGuardianConsent(profile.id), getOrg(profile.org_id)]);
  if (consent?.status === "confirmed") redirect("/dashboard");

  const expired = isPast(consent?.token_expires_at);
  const status = consent?.status ?? "requested";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">보호자 동의가 필요해요</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          만 14세 미만은 보호자(부모님)가 동의해야 magic.ai를 이용할 수 있어요. 동의가 확인되면 바로 상담을 시작할 수 있어요.
        </p>

        <p className="mt-5 inline-block rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold">
          지금 상태: {GUARDIAN_STATUS_LABEL[status]}
          {consent?.submitted_at && status === "submitted" && ` (${fmtDate(consent.submitted_at)} 제출)`}
        </p>

        {status === "submitted" ? (
          <p className="mt-4 text-sm leading-relaxed">
            보호자께서 동의서를 보내 주셨어요. 운영자가 확인하고 있어요. 확인이 끝나면 다시 들어와 주세요.
          </p>
        ) : (
          <>
            <h2 className="mt-6 font-semibold">방법 1. 보호자께 링크 보내기</h2>
            <p className="mt-1 text-sm text-muted">아래 링크를 부모님께 보내 주세요. 부모님이 내용을 읽고 동의서를 제출하면 돼요.</p>
            <GuardianLinkBox token={consent?.token ?? null} expired={expired || status === "rejected" || status === "withdrawn"} />

            <h2 className="mt-6 font-semibold">방법 2. 학교에 서면 동의서 내기</h2>
            <p className="mt-1 text-sm text-muted">
              {org ? `${org.name} 담당 선생님께` : "학교·기관 담당 선생님께"} 보호자 동의서를 내면, 선생님이나 운영자가 확인한 뒤 이용할 수 있어요.
            </p>
          </>
        )}

        <div className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-sm">
          지금 많이 힘들다면 기다리지 말고 바로 연락해요. 청소년상담 <a href="tel:1388" className="font-bold">1388</a>, 자살예방 상담전화{" "}
          <a href="tel:109" className="font-bold">109</a>, 위급하면 <a href="tel:112" className="font-bold">112</a>·<a href="tel:119" className="font-bold">119</a>
        </div>

        <form action={signOut} className="mt-6">
          <button className="text-sm text-muted hover:text-ink">로그아웃</button>
        </form>
      </div>
    </main>
  );
}
