"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = {
  total: number;
  updated: { file: string; title: string; chunks: number }[];
  removed: string[];
  unchanged: number;
  unreviewed: number;
};

export function SyncButton({ pending, disabled }: { pending: number; disabled?: boolean }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(force: boolean) {
    if (force && !confirm("모든 문서를 처음부터 다시 임베딩할까요? 문서가 많으면 몇 분 걸릴 수 있어요.")) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/knowledge/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "갱신하지 못했어요.");
      setResult(data);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "갱신하지 못했어요.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => run(false)}
          disabled={running || disabled}
          className="rounded-xl bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-strong disabled:opacity-50"
        >
          {running ? "갱신하는 중… (최대 몇 분)" : pending ? `지식베이스 갱신 (${pending}건)` : "지식베이스 갱신"}
        </button>
        <button
          type="button"
          onClick={() => run(true)}
          disabled={running || disabled}
          className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold hover:border-brand disabled:opacity-50"
        >
          전체 다시 임베딩
        </button>
      </div>

      {running && <p className="mt-3 text-sm text-muted">이 창을 닫지 말고 기다려 주세요. open.hasa 사용 한도 때문에 요청 사이에 잠깐씩 쉬어 가요.</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      {result && (
        <div className="mt-4 rounded-xl bg-brand-soft p-4 text-sm">
          <p className="font-semibold text-brand-strong">
            완료: 전체 {result.total}건 중 {result.updated.length}건 갱신, {result.removed.length}건 삭제, {result.unchanged}건 그대로
          </p>
          {result.updated.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-muted">
              {result.updated.map((u) => (
                <li key={u.file}>
                  ✓ {u.title} <span className="tabular-nums">({u.chunks}개 조각)</span>
                </li>
              ))}
            </ul>
          )}
          {result.removed.length > 0 && <p className="mt-2 text-muted">삭제: {result.removed.join(", ")}</p>}
          {result.unreviewed > 0 && <p className="mt-2 text-muted">참고: 아직 검토 전(reviewed: false)인 문서가 {result.unreviewed}건 있어요.</p>}
        </div>
      )}
    </div>
  );
}
