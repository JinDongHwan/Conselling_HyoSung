"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next, demo }: { next: string; demo: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
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
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError("이메일 또는 비밀번호가 맞지 않아요.");
      else router.push(next);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl() },
      });
      if (error) setError(error.message.includes("Password") ? "비밀번호는 8자 이상으로 정해 주세요." : "가입하지 못했어요. 이메일을 확인해 주세요.");
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
        <label className="block">
          <span className="text-sm font-medium">비밀번호</span>
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
        {mode === "signup" && (
          <label className="flex items-start gap-2 pt-1 text-sm">
            <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 accent-brand" />
            <span>만 19세 이상이며, 이용약관과 개인정보(민감정보 포함) 수집·이용에 동의합니다.</span>
          </label>
        )}

        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {notice && <p className="text-sm text-brand">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
        >
          {mode === "login" ? "로그인" : "가입하기"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {mode === "login" ? "처음이신가요?" : "이미 계정이 있나요?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="font-semibold text-brand hover:underline"
        >
          {mode === "login" ? "이메일로 가입하기" : "로그인하기"}
        </button>
      </p>
    </div>
  );
}
