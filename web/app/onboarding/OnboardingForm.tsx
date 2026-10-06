"use client";

import { useActionState, useState } from "react";
import { AGE_BAND_LABEL, ageBand, ageOn } from "@/lib/age";
import { completeOnboarding, type FormState } from "./actions";
import { ConsentChecklist } from "./ConsentChecklist";

// 시작 설정 화면: 생년월일을 넣으면 나이 구간에 맞는 안내와 동의 문구로 바뀐다. 최종 확인은 서버에서 한다.
export function OnboardingForm({
  nickname,
  birthDate,
  orgName,
  initialCode,
  defaultAdminView,
  terms,
  privacy,
}: {
  nickname: string;
  birthDate: string;
  orgName: string | null; // 이미 기관에 소속된 경우
  initialCode: string;
  defaultAdminView: boolean;
  terms: React.ReactNode;
  privacy: React.ReactNode;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(completeOnboarding, {});
  const [birth, setBirth] = useState(birthDate);
  const [code, setCode] = useState(initialCode);
  const [showCode, setShowCode] = useState(Boolean(initialCode));

  const age = birth ? ageOn(birth) : null;
  const band = age !== null && age >= 0 ? ageBand(age) : null;
  const hasOrg = Boolean(orgName || code.trim());
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action}>
      <label className="mt-6 block">
        <span className="text-sm font-medium">불러 드릴 이름</span>
        <input
          name="nickname"
          defaultValue={nickname}
          maxLength={20}
          placeholder="별명도 괜찮아요"
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium">생년월일</span>
        <input
          name="birth_date"
          type="date"
          required
          min="1900-01-01"
          max={today}
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
        />
        {band && (
          <span className="mt-1.5 block text-xs text-muted">
            만 {age}세 · {AGE_BAND_LABEL[band]}
          </span>
        )}
      </label>

      {/* 학교·기관 코드: 만 19세 미만은 필수 */}
      {orgName ? (
        <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm">
          소속 기관: <b>{orgName}</b>
        </p>
      ) : showCode || (band && band !== "adult") ? (
        <label className="mt-4 block">
          <span className="text-sm font-medium">학교·기관 가입 코드 {band && band !== "adult" ? <b className="text-danger">(필수)</b> : "(선택)"}</span>
          <input
            name="org_code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={12}
            autoComplete="off"
            placeholder="예: K7MPX2QA"
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 font-mono tracking-wider uppercase outline-none focus:border-brand"
          />
          <span className="mt-1.5 block text-xs text-muted">학교나 기관 담당 선생님께 받은 코드를 입력해 주세요.</span>
        </label>
      ) : (
        <button type="button" onClick={() => setShowCode(true)} className="mt-3 text-sm font-semibold text-brand hover:underline">
          학교·기관에서 받은 가입 코드가 있어요
        </button>
      )}

      {band && band !== "adult" && (
        <div className="mt-4 rounded-xl bg-accent-soft px-4 py-3 text-sm leading-relaxed">
          {band === "teen" ? (
            <>만 19세 미만은 학교나 기관을 통해서만 이용할 수 있어요.{!hasOrg && " 가입 코드를 입력해 주세요."}</>
          ) : (
            <>
              만 14세 미만은 학교나 기관 코드와 함께 <b>보호자(부모님) 동의</b>가 필요해요. 다음 화면에서 보호자께 보낼 동의 링크를 받을 수 있어요.
              보호자 동의가 확인되기 전에는 상담을 이용할 수 없어요.
            </>
          )}
        </div>
      )}

      <ConsentChecklist terms={terms} privacy={privacy} defaultAdminView={defaultAdminView} band={band} />

      {state.error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {state.error}
        </p>
      )}

      <button disabled={pending} className="mt-6 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong disabled:opacity-60">
        {pending ? "확인하고 있어요…" : "동의하고 시작하기"}
      </button>
    </form>
  );
}
