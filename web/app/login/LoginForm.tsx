"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Supabase 인증 오류를 이해하기 쉬운 문장으로 바꾼다. 모르는 오류는 원문(코드)을 함께 보여 준다.
function authMessage(err: { message: string; code?: string; status?: number }, fallback: string) {
  const m = err.message.toLowerCase();
  if (err.code === "invalid_credentials" || m.includes("invalid login")) return "이메일 또는 비밀번호가 맞지 않아요.";
  if (err.code === "email_not_confirmed" || m.includes("not confirmed")) return "메일함의 인증 링크를 먼저 눌러 주세요.";
  if (err.code === "user_already_exists" || m.includes("already registered")) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (err.code === "weak_password" || m.includes("password")) return "비밀번호가 너무 약해요. 8자 이상, 영문·숫자를 섞어 주세요.";
  if (err.code === "over_email_send_rate_limit" || m.includes("rate limit")) return "인증 메일을 너무 자주 보냈어요. 잠시 후 다시 시도해 주세요.";
  if (err.code === "email_address_invalid" || m.includes("invalid") && m.includes("email")) return "사용할 수 없는 이메일 주소예요.";
  return `${fallback} (${err.code ?? err.status ?? ""} ${err.message})`;
}

type Mode = "login" | "signup" | "reset";

export function LoginForm({ next, demo, initialMode = "login" }: { next: string; demo: boolean; initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (demo) return router.push(next);
    if (mode === "signup" && !adult) return setError("만 19세 이상만 가입할 수 있어요.");
    setBusy(true);
    const supabase = createClient();
    if (mode === "reset") {
      // 메일의 링크 → /auth/callback 에서 로그인 처리 → /reset-password 에서 새 비밀번호 입력
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
      });
      if (error) setError(authMessage(error, "재설정 메일을 보내지 못했어요."));
      // 가입 여부를 알려 주지 않도록 항상 같은 안내를 보여 준다
      else setNotice("가입된 이메일이라면 비밀번호 재설정 메일을 보냈어요. 메일의 링크를 눌러 새 비밀번호를 정해 주세요.");
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(authMessage(error, "이메일 또는 비밀번호가 맞지 않아요."));
      else router.push(next);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) setError(authMessage(error, "가입하지 못했어요."));
      else setNotice("인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 완료됩니다.");
    }
    setBusy(false);
  }

  async function kakao() {
    if (demo) return router.push(next);
    setBusy(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setError("카카오 로그인을 시작하지 못했어요.");
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={kakao}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3 font-semibold text-[#191919] hover:brightness-95 disabled:opacity-60"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-5">
          <path fill="#191919" d="M12 3C6.48 3 2 6.48 2 10.77c0 2.77 1.86 5.2 4.66 6.57l-.95 3.47c-.08.3.26.54.52.37l4.13-2.73c.54.06 1.08.1 1.64.1 5.52 0 10-3.48 10-7.78S17.52 3 12 3Z" />
        </svg>
        카카오로 계속하기
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        또는 이메일로
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium">이메일</span>
          <input
            type="email"
            required={!demo}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
          />
        </label>
        {mode === "reset" ? (
          <p className="text-sm text-muted">가입한 이메일을 입력하면 비밀번호를 다시 정할 수 있는 링크를 보내 드려요.</p>
        ) : (
          <label className="block">
            <span className="flex items-center justify-between text-sm font-medium">
              비밀번호
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("reset");
                    setError(null);
                    setNotice(null);
                  }}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </button>
              )}
            </span>
            <input
              type="password"
              required={!demo}
              minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
            />
          </label>
        )}
        {mode === "signup" && (
          <label className="flex items-start gap-2 pt-1 text-sm">
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 accent-brand" />
            <span>만 19세 이상입니다.</span>
          </label>
        )}

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {notice && <p className="text-sm text-brand">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {mode === "login" ? "로그인" : mode === "signup" ? "가입하기" : "재설정 메일 보내기"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === "login" ? "처음이신가요?" : mode === "signup" ? "이미 계정이 있나요?" : "비밀번호가 기억나셨나요?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
            setNotice(null);
          }}
          className="font-semibold text-brand hover:underline"
        >
          {mode === "login" ? "이메일로 가입하기" : "로그인하기"}
        </button>
      </p>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        처음 가입하면 다음 단계에서{" "}
        <Link href="/terms" target="_blank" className="underline">이용약관</Link>과{" "}
        <Link href="/privacy" target="_blank" className="underline">개인정보처리방침</Link> 동의를 받아요.
      </p>
    </div>
  );
}
