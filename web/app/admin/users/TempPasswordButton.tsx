"use client";

import { useState, useTransition } from "react";
import { adminIssueTempPassword } from "@/app/actions";

// 관리자: 임시 비밀번호 발급. 결과는 이 화면에서 한 번만 보여 주고 저장하지 않는다.
export function TempPasswordButton({ userId, label }: { userId: string; label: string }) {
  const [pending, start] = useTransition();
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const issue = () => {
    if (!confirm(`${label}님의 비밀번호를 임시 비밀번호로 바꿀까요?\n기존 비밀번호로는 더 이상 로그인할 수 없어요.`)) return;
    setError(null);
    start(async () => {
      const res = await adminIssueTempPassword(userId);
      if (res.error) setError(res.error);
      else setPassword(res.password ?? null);
    });
  };

  if (password) {
    return (
      <div className="min-w-56 space-y-1.5">
        <div className="flex items-center gap-2">
          <code className="rounded-md bg-accent-soft px-2 py-1 font-mono text-sm font-semibold">{password}</code>
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(password);
              setCopied(true);
            }}
            className="text-xs font-semibold text-brand hover:underline"
          >
            {copied ? "복사됨" : "복사"}
          </button>
        </div>
        <p className="text-xs leading-snug text-muted">
          이 화면을 벗어나면 다시 볼 수 없어요. 사용자에게 안전하게 전달하고, 로그인 후 마이페이지에서 바꾸도록 안내해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={issue}
        disabled={pending}
        className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold hover:border-brand disabled:opacity-50"
      >
        {pending ? "발급 중…" : "임시 비밀번호"}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
