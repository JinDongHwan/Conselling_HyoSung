"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { renewGuardianLink } from "../actions";

// 보호자 동의 링크 복사 · 새 링크 받기
export function GuardianLinkBox({ token, expired }: { token: string | null; expired: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 사이트 주소는 브라우저에서만 알 수 있다 (서버 렌더링 때는 null)
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => null,
  );
  const url = token && origin ? `${origin}/guardian/${token}` : null;

  const renew = () =>
    start(async () => {
      const res = await renewGuardianLink();
      if (res.error) setError(res.error);
      else router.refresh();
    });

  if (!token || expired) {
    return (
      <div className="mt-3">
        <p className="text-sm text-muted">{expired ? "링크 기간이 지났거나 다시 요청해야 해요." : "아직 동의 링크가 없어요."}</p>
        <button type="button" onClick={renew} disabled={pending} className="mt-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "만드는 중…" : "새 동의 링크 받기"}
        </button>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </div>
    );
  }

  if (!url) return <p className="mt-3 text-sm text-muted">링크를 불러오고 있어요…</p>;

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <input readOnly value={url} aria-label="보호자 동의 링크" className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 font-mono text-xs" />
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        }}
        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
      >
        {copied ? "복사했어요" : "링크 복사"}
      </button>
    </div>
  );
}
