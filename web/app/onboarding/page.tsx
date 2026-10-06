import { PrivacyBody } from "@/components/legal/PrivacyBody";
import { TermsBody } from "@/components/legal/TermsBody";
import { Logo } from "@/components/Logo";
import { requireProfile } from "@/lib/auth";
import { POLICY_EFFECTIVE_DATE } from "@/lib/company";
import { getOrg } from "@/lib/orgs";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const profile = await requireProfile();
  const { code } = await props.searchParams;
  const org = await getOrg(profile.org_id);
  // 이미 가입했는데 약관이 바뀌어 다시 동의하는 경우
  const reconsent = Boolean(profile.birth_year || profile.birth_date);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">{reconsent ? "약관이 바뀌었어요" : "시작하기 전에 확인할게요"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {reconsent
            ? "바뀐 이용약관과 개인정보처리방침을 확인하고 다시 동의해 주세요. 생년월일도 한 번 확인해 주세요."
            : "개인 가입은 만 19세 이상이에요. 학생은 학교나 기관에서 받은 가입 코드로 이용할 수 있어요."}
        </p>

        <OnboardingForm
          nickname={profile.nickname ?? ""}
          birthDate={profile.birth_date ?? ""}
          orgName={org?.name ?? null}
          initialCode={typeof code === "string" ? code.toUpperCase() : ""}
          defaultAdminView={profile.consent_admin_view}
          terms={<TermsBody />}
          privacy={<PrivacyBody />}
        />
        <p className="mt-3 text-xs text-muted">시행일 {POLICY_EFFECTIVE_DATE} · 동의한 날짜와 약관 버전이 기록돼요.</p>
      </div>
    </main>
  );
}
