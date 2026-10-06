"use client";

import { useRef, useState, useTransition } from "react";
import { ORG_TYPE_LABEL } from "@/lib/format";
import { createInviteCode, createOrg, setInviteCodeActive, updateOrg } from "./actions";

type Result = { ok?: true; error?: string };

// 서버 작업을 실행하고 결과 문구를 보여 주는 공통 훅
function useRun() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = (fn: () => Promise<Result>, done: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: done });
      if (!r.error) after?.();
    });
  const message = msg && <p className={`text-sm ${msg.ok ? "text-brand" : "text-danger"}`}>{msg.text}</p>;
  return { pending, run, message };
}

const input = "rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand";

export function CreateOrgForm({ parents }: { parents: { id: string; name: string }[] }) {
  const { pending, run, message } = useRun();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={form}
      action={(fd) => run(() => createOrg(fd), "기관을 등록했어요.", () => form.current?.reset())}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <label className="flex flex-col gap-1 text-sm lg:col-span-2">
        기관 이름
        <input name="name" required maxLength={60} placeholder="예: 서울OO중학교" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        종류
        <select name="type" required defaultValue="school" className={input}>
          {Object.entries(ORG_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        상위 기관 (선택)
        <select name="parent_id" defaultValue="" className={input}>
          <option value="">없음</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allow_minors" className="accent-brand" /> 만 14~18세 가입 허용
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="allow_under14" className="accent-brand" /> 만 14세 미만 가입 허용 (보호자 동의 필수)
      </label>
      <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-2 lg:justify-end">
        {message}
        <button disabled={pending} className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          기관 등록
        </button>
      </div>
    </form>
  );
}

export function OrgPolicyControls({ orgId, active, allowMinors, allowUnder14 }: { orgId: string; active: boolean; allowMinors: boolean; allowUnder14: boolean }) {
  const { pending, run, message } = useRun();
  const toggle = (label: string, patch: Parameters<typeof updateOrg>[1]) => {
    if (!confirm(`${label}할까요?`)) return;
    run(() => updateOrg(orgId, patch), "바꿨어요.");
  };
  const btn = "rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:border-brand disabled:opacity-50";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} className={btn} onClick={() => toggle(allowMinors ? "만 14~18세 가입을 막기" : "만 14~18세 가입을 허용", { allow_minors: !allowMinors })}>
        14~18세 {allowMinors ? "허용 중" : "막힘"}
      </button>
      <button type="button" disabled={pending} className={btn} onClick={() => toggle(allowUnder14 ? "만 14세 미만 가입을 막기" : "만 14세 미만 가입을 허용(보호자 동의 필수)", { allow_under14: !allowUnder14 })}>
        14세 미만 {allowUnder14 ? "허용 중" : "막힘"}
      </button>
      <button type="button" disabled={pending} className={btn} onClick={() => toggle(active ? "이 기관을 운영 중지(새 가입 막기)" : "이 기관을 다시 운영", { active: !active })}>
        {active ? "운영 중" : "운영 중지됨"}
      </button>
      {message}
    </div>
  );
}

export function CreateCodeForm({ orgId }: { orgId: string }) {
  const { pending, run, message } = useRun();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={(fd) => run(() => createInviteCode(orgId, fd), "코드를 만들었어요.", () => form.current?.reset())} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-xs text-muted">
        이름표 (선택)
        <input name="label" maxLength={40} placeholder="예: 3학년 2반" className={input} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        유효기간
        <select name="days" defaultValue="30" className={input}>
          <option value="7">7일</option>
          <option value="30">30일</option>
          <option value="90">90일</option>
          <option value="365">1년</option>
          <option value="0">제한 없음</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        최대 인원 (0 = 제한 없음)
        <input name="max_uses" type="number" min={0} defaultValue={0} className={`${input} w-28`} />
      </label>
      <button disabled={pending} className="rounded-xl bg-dark px-4 py-2 text-sm font-semibold text-page disabled:opacity-60">
        가입 코드 만들기
      </button>
      {message}
    </form>
  );
}

export function CodeActiveToggle({ code, active }: { code: string; active: boolean }) {
  const { pending, run } = useRun();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(active ? `코드 ${code}를 사용 중지할까요? 이 코드로는 더 가입할 수 없어요.` : `코드 ${code}를 다시 사용할까요?`)) return;
        run(() => setInviteCodeActive(code, !active), "");
      }}
      className="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
    >
      {active ? "사용 중지" : "다시 사용"}
    </button>
  );
}

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      }}
      className="font-mono text-sm font-bold tracking-wider hover:text-brand"
      title="코드 복사"
    >
      {code} <span className="text-xs font-normal text-muted">{copied ? "복사됨" : "복사"}</span>
    </button>
  );
}
