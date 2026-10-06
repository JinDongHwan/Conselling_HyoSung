"use client";

import { useState } from "react";
import { LEGAL_PROSE } from "@/components/legal/LegalPage";
import type { AgeBand } from "@/lib/age";

type Item = {
  name: string; // 폼 필드 이름 (서버에서 확인)
  required: boolean;
  label: React.ReactNode;
  doc?: React.ReactNode; // 펼쳐 볼 전문
};

// 연령별 동의 문구. 청소년에게는 쉬운 말로 같은 내용을 보여 준다.
// TODO(법률 검토): 연령별 동의 문구와 만 14세 미만 본인 안내 범위
function itemsFor(band: AgeBand | null, terms: React.ReactNode, privacy: React.ReactNode): Item[] {
  if (band === "teen" || band === "under14") {
    return [
      { name: "agree_terms", required: true, label: <>magic.ai 이용 규칙(이용약관)을 읽었고 지킬게요. AI는 의사나 상담 선생님을 대신하지 않는다는 걸 알아요.</>, doc: terms },
      { name: "agree_privacy", required: true, label: <>별명, 생년월일, 소속 학교·기관 정보를 서비스에 쓰는 데 동의해요. 탈퇴하면 지워져요.</>, doc: privacy },
      {
        name: "agree_sensitive",
        required: true,
        label: (
          <>
            내가 쓴 고민과 기분 기록은 마음 건강에 관한 소중한 정보예요. AI가 답하려고 이 내용을 처리하는 데 동의해요. 위험한 상황으로 보이면 안전을 위해 운영자가 확인하고 도움받을 곳을 알려 줘요.
            {band === "under14" && <b className="mt-1 block text-accent-ink">만 14세 미만은 보호자(부모님)의 동의도 함께 받아야 해요.</b>}
          </>
        ),
        doc: privacy,
      },
    ];
  }
  return [
    { name: "agree_terms", required: true, label: <>이용약관에 동의합니다. AI 상담이 의료 서비스를 대체하지 않는다는 점을 이해했습니다.</>, doc: terms },
    { name: "agree_privacy", required: true, label: <>개인정보 수집·이용에 동의합니다. (이메일, 닉네임, 생년월일, 소속 기관 · 탈퇴 시 삭제)</>, doc: privacy },
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
}

// 약관 동의: 전체 동의 + 항목별 체크 + 전문 펼쳐 보기
export function ConsentChecklist({
  terms,
  privacy,
  defaultAdminView,
  band,
}: {
  terms: React.ReactNode;
  privacy: React.ReactNode;
  defaultAdminView: boolean;
  band: AgeBand | null;
}) {
  const items = itemsFor(band, terms, privacy);

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
        {items.some((it) => !it.required) ? "전체 동의 (선택 항목 포함)" : "전체 동의"}
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
