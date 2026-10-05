import { Logo } from "@/components/Logo";
import { DEMO_MODE } from "@/lib/config";
import { LoginForm } from "./LoginForm";

export default async function LoginPage(props: PageProps<"/login">) {
  const { next, mode, error } = await props.searchParams;
  const errorText =
    error === "banned"
      ? "이용이 정지된 계정이에요. 자세한 내용은 홈페이지 맨 아래 문의 메일로 연락해 주세요."
      : error === "auth"
        ? "로그인을 마치지 못했어요. 다시 시도해 주세요."
        : null;
  const target = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-brand p-12 text-white lg:flex">
        <Logo onDark />
        <div>
          <p className="text-4xl leading-snug font-bold">
            괜찮은 척하지 않아도
            <br />
            되는 곳
          </p>
          <p className="mt-4 max-w-sm leading-relaxed opacity-85">
            대화 원문은 기본적으로 나만 볼 수 있어요. 언제든 기록을 지우고 떠날 수 있습니다.
          </p>
        </div>
        <p className="text-sm opacity-75">위기 상황이라면 지금 바로 109</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 text-3xl font-bold lg:mt-0">magic.ai 시작하기</h1>
          <p className="mt-2 text-sm text-muted">만 19세 이상 성인만 이용할 수 있어요.</p>
          {errorText && (
            <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {errorText}
            </p>
          )}
          {DEMO_MODE && (
            <p className="mt-4 rounded-lg bg-accent-soft px-3 py-2 text-sm">
              데모 모드입니다. 아무 버튼이나 누르면 로그인 없이 대시보드로 이동해요.
            </p>
          )}
          <div className="mt-8">
            <LoginForm next={target} demo={DEMO_MODE} initialMode={mode === "reset" ? "reset" : mode === "signup" ? "signup" : "login"} />
          </div>
        </div>
      </section>
    </main>
  );
}
