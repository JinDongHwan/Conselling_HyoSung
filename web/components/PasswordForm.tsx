"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 로그인된 사용자의 비밀번호를 바꾼다 (재설정 메일 링크로 들어온 경우도 로그인 상태)
export function PasswordForm({ redirectTo, submitLabel = "비밀번호 변경" }: { redirectTo?: string; submitLabel?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("비밀번호는 8자 이상으로 정해 주세요.");
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return setError("영문과 숫자를 함께 넣어 주세요.");
    if (password !== confirm) return setError("두 비밀번호가 서로 달라요.");
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes("different from the old")) return setError("이전 비밀번호와 다른 비밀번호로 정해 주세요.");
      if (m.includes("session") || m.includes("auth")) return setError("링크가 만료됐어요. 로그인 화면에서 재설정 메일을 다시 받아 주세요.");
      return setError(`비밀번호를 바꾸지 못했어요. (${error.message})`);
    }
    setDone(true);
    setPassword("");
    setConfirm("");
    if (redirectTo) setTimeout(() => router.push(redirectTo), 1200);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3">
      <label className="block">
        <span className="text-sm font-medium">새 비밀번호</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
        />
        <span className="mt-1 block text-xs text-muted">8자 이상, 영문과 숫자를 섞어 주세요.</span>
      </label>
      <label className="block">
        <span className="text-sm font-medium">새 비밀번호 확인</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
        />
      </label>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {done && <p className="text-sm text-brand">비밀번호를 바꿨어요.{redirectTo ? " 잠시 후 이동합니다." : ""}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong disabled:opacity-60"
      >
        {busy ? "바꾸는 중…" : submitLabel}
      </button>
    </form>
  );
}
