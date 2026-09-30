"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveAssessment } from "@/app/actions";
import { CrisisCard } from "@/components/CrisisCard";
import { ASSESSMENTS, type AssessmentType, bandOf, SCALE } from "@/lib/assessments";

export function AssessmentForm({ type }: { type: AssessmentType }) {
  const def = ASSESSMENTS[type];
  const [answers, setAnswers] = useState<(number | null)[]>(() => def.items.map(() => null));
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const done = answers.every((a) => a !== null);
  const selfHarm = type === "PHQ-9" && (answers[8] ?? 0) > 0;

  const submit = () =>
    start(async () => {
      try {
        const { score } = await saveAssessment(type, answers as number[]);
        setResult(score);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        setError("결과를 저장하지 못했어요. 다시 시도해 주세요.");
      }
    });

  if (result !== null) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <p className="text-sm text-muted">{def.name} 결과</p>
          <p className="mt-2 text-5xl font-bold text-brand">
            {result}
            <span className="text-xl text-muted"> / {def.max}</span>
          </p>
          <p className="mt-2 text-lg font-semibold">{bandOf(type, result)}</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            {result >= 10
              ? "요즘 마음이 꽤 지쳐 있는 것 같아요. 혼자 버티기보다 정신건강의학과나 거주지 정신건강복지센터와 이야기해 보길 권해요."
              : "지금의 상태를 알아 둔 것만으로도 좋은 시작이에요. 2주 뒤에 다시 검사해서 변화를 살펴보세요."}
          </p>
        </div>
        {selfHarm && <CrisisCard />}
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/data" className="rounded-full bg-brand px-5 py-2.5 font-semibold text-white">
            데이터에서 보기
          </Link>
          <Link href="/dashboard/counsel" className="rounded-full border border-line px-5 py-2.5 font-semibold hover:border-brand">
            결과에 대해 이야기하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-muted">{def.intro}</p>
      <ol className="mt-6 space-y-4">
        {def.items.map((item, i) => (
          <li key={i} className="rounded-2xl border border-line bg-surface p-5">
            <fieldset>
              <legend className="font-medium">
                <span className="mr-2 text-muted">{i + 1}.</span>
                {item}
              </legend>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SCALE.map((label, v) => (
                  <label key={v} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`q${i}`}
                      className="peer sr-only"
                      checked={answers[i] === v}
                      onChange={() => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))}
                    />
                    <span className="block rounded-lg border border-line px-2 py-2 text-center text-sm peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:font-semibold peer-focus-visible:ring-2 peer-focus-visible:ring-accent hover:border-brand">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {i === 8 && selfHarm && (
              <div className="mt-4">
                <CrisisCard compact />
              </div>
            )}
          </li>
        ))}
      </ol>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={!done || pending}
        className="mt-6 w-full rounded-xl bg-brand px-4 py-3.5 font-semibold text-white hover:bg-brand-strong disabled:opacity-40 sm:w-auto sm:px-10"
      >
        {pending ? "저장하는 중" : done ? "결과 보기" : `${answers.filter((a) => a !== null).length} / ${def.items.length} 응답`}
      </button>
    </div>
  );
}
