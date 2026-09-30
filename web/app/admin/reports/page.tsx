import { BarList, LineChart } from "@/components/charts";
import { PageHeader, Panel } from "@/components/PageHeader";
import { adminOverview, adminTopicCounts } from "@/lib/data";
import { lastDayLabels } from "@/lib/format";

export default async function ReportsPage() {
  const [o, topics] = await Promise.all([adminOverview(), adminTopicCounts()]);
  const labels = lastDayLabels(o.daily.length);
  const total14 =o.daily.reduce((a, b) => a + b, 0);
  const firstWeek = o.daily.slice(0, 7).reduce((a, b) => a + b, 0);
  const secondWeek = o.daily.slice(7).reduce((a, b) => a + b, 0);
  const growth = firstWeek ? Math.round(((secondWeek - firstWeek) / firstWeek) * 100) : 0;

  return (
    <>
      <PageHeader title="리포트" description="상담 주제와 이용 추이를 운영 보고용으로 정리했어요." />
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-8">
        <Panel title="요약">
          <p className="leading-relaxed">
            최근 14일 동안 상담 <b>{total14}건</b>이 진행되었고, 지난주 대비 이번 주 상담은{" "}
            <b>{growth >= 0 ? `${growth}% 늘었습니다` : `${Math.abs(growth)}% 줄었습니다`}</b>. 가장 많이 나온 주제는{" "}
            <b>{topics[0]?.topic ?? "-"}</b>이며, 위기 세션은 <b>{o.risk.high}건</b>입니다.
          </p>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="주제별 상담 빈도 (최근 30일)">
            <BarList data={topics.map((t) => ({ label: t.topic, value: t.count }))} />
          </Panel>
          <Panel title="일별 상담 수 (최근 14일)">
            <LineChart
              title="일별 상담 수"
              data={o.daily.map((v, i) => ({ label: labels[i], value: v }))}
              min={0}
              max={Math.max(10, Math.ceil(Math.max(...o.daily) / 10) * 10)}
              unit="건"
            />
          </Panel>
        </div>
      </div>
    </>
  );
}
