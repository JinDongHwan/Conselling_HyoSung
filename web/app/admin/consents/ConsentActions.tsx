"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideGuardianConsent, recordPaperConsent } from "../orgs/actions";

// 보호자 동의: 확인 완료 · 거절 · 철회 처리
export function ConsentActions({ consentId, status }: { consentId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const decide = (decision: "confirmed" | "rejected" | "withdrawn", question: string) => {
    const memo = prompt(`${question}\n메모를 남겨 주세요 (예: 보호자와 전화로 확인함). 취소하면 처리하지 않아요.`);
    if (memo === null) return;
    setError(null);
    start(async () => {
      const r = await decideGuardianConsent(consentId, decision, memo);
      if (r.error) setError(r.error);
      else router.refresh();
    });
  };

  const btn = "rounded-lg border px-2.5 py-1 text-xs font-semibold disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "submitted" && (
        <>
          <button type="button" disabled={pending} onClick={() => decide("confirmed", "보호자 동의를 확인 완료할까요? 학생이 상담을 이용할 수 있게 돼요.")} className={`${btn} border-brand text-brand hover:bg-brand-soft`}>
            확인 완료
          </button>
          <button type="button" disabled={pending} onClick={() => decide("rejected", "이 제출을 거절할까요? 학생은 새 링크를 받아 다시 요청할 수 있어요.")} className={`${btn} border-line hover:border-danger`}>
            거절
          </button>
        </>
      )}
      {status === "confirmed" && (
        <button type="button" disabled={pending} onClick={() => decide("withdrawn", "보호자가 동의를 철회했나요? 학생은 상담을 이용할 수 없게 돼요.")} className={`${btn} border-line hover:border-danger`}>
          철회 처리
        </button>
      )}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

// 학교에서 받은 서면 동의서를 확인했을 때 (사용자 상세 화면)
export function PaperConsentForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const input = "rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <form
      action={(fd) => {
        if (!confirm("서면 보호자 동의서를 확인했나요? 확인하면 학생이 상담을 이용할 수 있게 돼요.")) return;
        start(async () => {
          const r = await recordPaperConsent(userId, fd);
          setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: "서면 동의를 기록했어요." });
          if (!r.error) router.refresh();
        });
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-col gap-1 text-xs text-muted">
        보호자 이름
        <input name="guardian_name" required maxLength={30} className={input} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        관계
        <select name="guardian_relation" required defaultValue="" className={input}>
          <option value="" disabled>선택</option>
          <option>부</option>
          <option>모</option>
          <option>법정후견인</option>
          <option>기타 법정대리인</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        메모 (선택)
        <input name="memo" maxLength={300} placeholder="예: OO중 상담실 제출본 확인" className={input} />
      </label>
      <button disabled={pending} className="rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-page disabled:opacity-60">
        서면 동의 확인
      </button>
      {msg && <span className={`text-sm ${msg.ok ? "text-brand" : "text-danger"}`}>{msg.text}</span>}
    </form>
  );
}
