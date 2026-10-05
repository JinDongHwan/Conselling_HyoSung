"use client";

import { useState } from "react";
import { LEGAL_PROSE } from "@/components/legal/LegalPage";

type Item = {
  name: string; // 폼 필드 이름 (서버에서 확인)
  required: boolean;
  label: React.ReactNode;
  doc?: React.ReactNode; // 펼쳐 볼 전문
};

// 약관 동의: 전체 동의 + 항목별 체크 + 전문 펼쳐 보기
export function ConsentChecklist({ terms, privacy, defaultAdminView }: { terms: React.ReactNode; privacy: React.ReactNode; defaultAdminView: boolean }) {
  const items: Item[] = [
    { name: "agree_terms", required: true, label: <>이용약관에 동의합니다. AI 상담이 의료 서비스를 대체하지 않는다는 점을 이해했습니다.</>, doc: terms },
    { name: "agree_privacy", required: true, label: <>개인정보 수집·이용에 동의합니다. (이메일, 닉네임, 출생연도 · 탈퇴 시 삭제)</>, doc: privacy },
    {
      name: "agree_sensitive",
      required: true,
      label: <>민감정보(상담 대화 내용, 기분·자가진단 기록) 처리에 동의합니다. AI 답변 생성을 위해 대화 내용이 AI 모델 제공 업체로 전송돼요.</>,
      doc: privacy,
    },
    {
      name: "consent_admin_view",
      required: false,
      label: <>더 나은 도움을 위해 관리자가 내 대화 원문을 볼 수 있도록 허용합니다. 동의하지 않아도 위기 상황에서는 안전을 위해 열람될 수 있어요.</>,
    },
  ];

  const [checked, setChecked] = useState<Record<string, boolean>>({ consent_admin_view: defaultAdminView });
  const [open, setOpen] = useState<string | null>(null);
  const allChecked = items.every((it) => checked[it.name]);

  return (
    <fieldset className="mt-6 rounded-xl bg-surface-2 p-4 text-sm">
      <legend className="sr-only">약관 동의</legend>
      <label className="flex items-center gap-2 border-b border-line pb-3 text-base font-bold">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => setChecked(Object.fromEntries(items.map((it) => [it.name, e.target.checked])))}
          className="size-4 accent-brand"
        />
        전체 동의 (선택 항목 포함)
      </label>
      <ul className="mt-3 space-y-3">
        {items.map((it) => (
          <li key={it.name}>
            <div className="flex items-start gap-2">
              <input
                id={it.name}
                type="checkbox"
                name={it.name}
                required={it.required}
                checked={!!checked[it.name]}
                onChange={(e) => setChecked((c) => ({ ...c, [it.name]: e.target.checked }))}
                className="mt-0.5 accent-brand"
              />
              <label htmlFor={it.name} className="flex-1">
                <b>{it.required ? "(필수)" : "(선택)"}</b> {it.label}
              </label>
              {it.doc && (
                <button
                  type="button"
                  onClick={() => setOpen(open === it.name ? null : it.name)}
                  aria-expanded={open === it.name}
                  className="shrink-0 text-xs font-semibold text-brand underline"
                >
                  {open === it.name ? "접기" : "전문 보기"}
                </button>
              )}
            </div>
            {it.doc && open === it.name && (
              <div className={`mt-2 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface space-y-6 p-4 text-[13px] leading-6 [&_h2]:text-[15px] ${LEGAL_PROSE}`}>
                {it.doc}
              </div>
            )}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
