"use client";

import { useActionState, useState } from "react";
import { LEGAL_PROSE } from "@/components/legal/LegalPage";
import { submitGuardianConsent, type FormState } from "@/app/onboarding/actions";

const ITEMS = [
  { name: "agree_terms", label: "자녀의 서비스 이용(이용약관)에 동의합니다.", doc: "terms" },
  { name: "agree_privacy", label: "자녀의 개인정보(별명, 생년월일, 소속 학교·기관) 수집·이용에 동의합니다.", doc: "privacy" },
  { name: "agree_sensitive", label: "자녀의 상담 대화·기분·자가진단 기록(민감정보) 처리에 동의합니다. AI 답변 생성을 위해 AI 모델 제공 업체로 전송돼요.", doc: "privacy" },
] as const;

// 보호자 동의서 입력·제출
export function GuardianForm({ token, terms, privacy }: { token: string; terms: React.ReactNode; privacy: React.ReactNode }) {
  const [state, action, pending] = useActionState<FormState, FormData>(submitGuardianConsent, {});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState<string | null>(null);
  const all = ITEMS.every((i) => checked[i.name]);

  if (state.ok) {
    return (
      <p className="mt-6 rounded-xl bg-brand-soft p-5 leading-relaxed">
        동의서를 제출했어요. 운영자가 확인하면 자녀가 서비스를 이용할 수 있어요. 확인을 위해 연락드릴 수 있어요. 감사합니다.
      </p>
    );
  }

  const input = "mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand";

  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="token" value={token} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">보호자 이름</span>
          <input name="guardian_name" required maxLength={30} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium">자녀와의 관계</span>
          <select name="guardian_relation" required defaultValue="" className={input}>
            <option value="" disabled>선택해 주세요</option>
            <option>부</option>
            <option>모</option>
            <option>법정후견인</option>
            <option>기타 법정대리인</option>
          </select>
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-sm font-medium">연락처 (휴대폰 번호 또는 이메일)</span>
        <input name="guardian_contact" required maxLength={60} placeholder="동의 확인을 위해서만 사용해요" className={input} />
      </label>

      <fieldset className="mt-6 rounded-xl bg-surface-2 p-4 text-sm">
        <legend className="sr-only">보호자 동의 항목</legend>
        <label className="flex items-center gap-2 border-b border-line pb-3 text-base font-bold">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) => setChecked(Object.fromEntries(ITEMS.map((i) => [i.name, e.target.checked])))}
            className="size-4 accent-brand"
          />
          전체 동의
        </label>
        <ul className="mt-3 space-y-3">
          {ITEMS.map((it) => (
            <li key={it.name}>
              <div className="flex items-start gap-2">
                <input
                  id={it.name}
                  type="checkbox"
                  name={it.name}
                  required
                  checked={!!checked[it.name]}
                  onChange={(e) => setChecked((c) => ({ ...c, [it.name]: e.target.checked }))}
                  className="mt-0.5 accent-brand"
                />
                <label htmlFor={it.name} className="flex-1">
                  <b>(필수)</b> {it.label}
                </label>
                <button type="button" onClick={() => setOpen(open === it.name ? null : it.name)} className="shrink-0 text-xs font-semibold text-brand underline">
                  {open === it.name ? "접기" : "전문 보기"}
                </button>
              </div>
              {open === it.name && (
                <div className={`mt-2 max-h-72 space-y-6 overflow-y-auto rounded-lg border border-line bg-surface p-4 text-[13px] leading-6 [&_h2]:text-[15px] ${LEGAL_PROSE}`}>
                  {it.doc === "terms" ? terms : privacy}
                </div>
              )}
            </li>
          ))}
        </ul>
      </fieldset>

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {state.error}
        </p>
      )}
      <button disabled={pending} className="mt-6 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
        {pending ? "제출하고 있어요…" : "동의서 제출하기"}
      </button>
      <p className="mt-3 text-xs leading-relaxed text-muted">동의하지 않으시면 이 페이지를 닫으시면 돼요. 자녀는 서비스를 이용할 수 없어요.</p>
    </form>
  );
}
