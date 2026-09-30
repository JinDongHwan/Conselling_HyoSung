import { completeOnboarding } from "@/app/actions";
import { Logo } from "@/components/Logo";
import { requireProfile } from "@/lib/auth";

export default async function OnboardingPage(props: PageProps<"/onboarding">) {
  const profile = await requireProfile();
  const { error } = await props.searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <form action={completeOnboarding} className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold">시작하기 전에 확인할게요</h1>
        <p className="mt-2 text-sm text-muted">magic.ai는 만 19세 이상 성인을 위한 서비스예요.</p>

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
            min={1900}
            max={new Date().getFullYear() - 19}
            placeholder="예: 1994"
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
          />
        </label>

        <fieldset className="mt-6 space-y-3 rounded-xl bg-surface-2 p-4 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" name="agree" required className="mt-0.5 accent-brand" />
            <span>
              <b>(필수)</b> 이용약관, 개인정보 및 민감정보(상담 내용) 수집·이용에 동의합니다. AI 상담이 의료 서비스를 대체하지 않는다는 점을 이해했습니다.
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="consent_admin_view" className="mt-0.5 accent-brand" />
            <span>
              <b>(선택)</b> 더 나은 도움을 위해 상담사가 내 대화 원문을 볼 수 있도록 허용합니다. 동의하지 않아도 위기 상황에서는 안전을 위해 열람될 수 있어요.
            </span>
          </label>
        </fieldset>

        {error && <p role="alert" className="mt-4 text-sm text-danger">만 19세 이상이고 필수 항목에 동의해야 시작할 수 있어요.</p>}

        <button className="mt-6 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong">
          동의하고 시작하기
        </button>
      </form>
    </main>
  );
}
