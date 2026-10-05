import { completeOnboarding } from "@/app/actions";
import { PrivacyBody } from "@/components/legal/PrivacyBody";
import { TermsBody } from "@/components/legal/TermsBody";
import { Logo } from "@/components/Logo";
import { requireProfile } from "@/lib/auth";
import { POLICY_EFFECTIVE_DATE } from "@/lib/company";
import { ConsentChecklist } from "./ConsentChecklist";

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const profile = await requireProfile();
  const { error } = await props.searchParams;
  // 이미 가입했는데 약관이 바뀌어 다시 동의하는 경우
  const reconsent = Boolean(profile.birth_year);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <form action={completeOnboarding} className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">{reconsent ? "약관이 바뀌었어요" : "시작하기 전에 확인할게요"}</h1>
        <p className="mt-2 text-sm text-muted">
          {reconsent ? "바뀐 이용약관과 개인정보처리방침을 확인하고 다시 동의해 주세요." : "magic.ai는 만 19세 이상 성인을 위한 서비스예요."}
        </p>

        <label className="mt-6 block">
          <span className="text-sm font-medium">불러 드릴 이름</span>
          <input
            name="nickname"
            defaultValue={profile.nickname ?? ""}
            maxLength={20}
            placeholder="별명도 괜찮아요"
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium">태어난 해</span>
          <input
            name="birth_year"
            type="number"
            required
            defaultValue={profile.birth_year ?? undefined}
            min={1900}
            max={new Date().getFullYear() - 19}
            placeholder="예: 1994"
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
          />
        </label>

        <ConsentChecklist terms={<TermsBody />} privacy={<PrivacyBody />} defaultAdminView={profile.consent_admin_view} />
        <p className="mt-2 text-xs text-muted">시행일 {POLICY_EFFECTIVE_DATE} · 동의한 날짜와 약관 버전이 기록돼요.</p>

        {error && <p role="alert" className="mt-4 text-sm text-danger">만 19세 이상이고 필수 항목에 동의해야 시작할 수 있어요.</p>}

        <button className="mt-6 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong">
          동의하고 시작하기
        </button>
      </form>
    </main>
  );
}
