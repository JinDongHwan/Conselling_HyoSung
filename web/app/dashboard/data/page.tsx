import Link from "next/link";
import { BarList, LineChart } from "@/components/charts";
import { PageHeader, Panel } from "@/components/PageHeader";
import { ASSESSMENTS, type AssessmentType, bandOf } from "@/lib/assessments";
import { requireProfile } from "@/lib/auth";
import { countTopics, listAssessments, listMoods, listSessions } from "@/lib/data";
import { fmtShort, withinDays } from "@/lib/format";

export default async function DataPage() {
  const profile = await requireProfile();
  const [moods, sessions, assessments] = await Promise.all([
    listMoods(profile.id, 30),
    listSessions(profile.id, 200),
    listAssessments(profile.id),
  ]);

  const avg = moods.length ? (moods.reduce((a, m) => a + m.score, 0) / moods.length).toFixed(1) : "-";
  const withChange = sessions.filter((s) => s.mood_start && s.mood_end);
  const change = withChange.length
    ? (withChange.reduce((a, s) => a + (s.mood_end! - s.mood_start!), 0) / withChange.length).toFixed(1)
    : null;
  const recent30 = sessions.filter((s) => withinDays(s.created_at, 30)).length;
  const topics = countTopics(sessions).slice(0, 7);

  return (
    <>
      <PageHeader title="데이터" description="기분 기록과 상담, 자가진단 결과로 내 마음의 흐름을 살펴봐요." />
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-8">
        <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
          <div className="bg-surface p-5">
            <dt className="text-sm text-muted">최근 30일 평균 기분</dt>
            <dd className="mt-1 text-3xl font-bold">{avg}<span className="text-base font-normal text-muted"> / 10</span></dd>
          </div>
          <div className="bg-surface p-5">
            <dt className="text-sm text-muted">최근 30일 상담</dt>
            <dd className="mt-1 text-3xl font-bold">{recent30}<span className="text-base font-normal text-muted">회</span></dd>
          </div>
          <div className="bg-surface p-5">
            <dt className="text-sm text-muted">상담 후 기분 변화 (평균)</dt>
            <dd className="mt-1 text-3xl font-bold">
              {change === null ? "-" : `${Number(change) > 0 ? "+" : ""}${change}`}
              <span className="text-base font-normal text-muted">점</span>
            </dd>
          </div>
        </dl>

        <Panel title="기분 점수 추이 (최근 30일)">
          <LineChart
            title="최근 30일 기분 점수"
            data={moods.map((m) => ({ label: fmtShort(m.created_at), value: m.score }))}
            min={1}
            max={10}
            height={220}
            unit="점"
          />
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          {(Object.keys(ASSESSMENTS) as AssessmentType[]).map((type) => {
            const rows = assessments.filter((a) => a.type === type);
            const last = rows.at(-1);
            return (
              <Panel
                key={type}
                title={ASSESSMENTS[type].name}
                action={
                  <Link
                    href={`/dashboard/data/assessment/${type}`}
                    className="rounded-full bg-brand px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-strong"
                  >
                    검사하기
                  </Link>
                }
              >
                {last && (
                  <p className="mb-3 text-sm text-muted">
                    최근 결과 <b className="text-ink">{last.score}점</b> ({bandOf(type, last.score)})
                  </p>
                )}
                <LineChart
                  title={`${type} 점수 변화`}
                  data={rows.map((a) => ({ label: fmtShort(a.created_at), value: a.score }))}
                  min={0}
                  max={ASSESSMENTS[type].max}
                  height={180}
                  unit="점"
                  bands={[{ from: 10, to: ASSESSMENTS[type].max, label: "10점 이상: 전문가 상담 권장" }]}
                />
              </Panel>
            );
          })}
        </div>

        <Panel title="자주 나온 상담 주제">
          <BarList data={topics.map((t) => ({ label: t.topic, value: t.count }))} unit="회" />
        </Panel>

        <p className="text-xs leading-relaxed text-muted">
          자가진단 결과는 참고용이며 의학적 진단이 아닙니다. 점수가 10점 이상이거나 일상이 힘들다면 정신건강의학과 또는 거주지 정신건강복지센터 상담을 권해요.
        </p>
      </div>
    </>
  );
}
