import Link from "next/link";
import { LineChart } from "@/components/charts";
import { PageHeader, Panel, RiskBadge } from "@/components/PageHeader";
import { adminOverview, listAlerts } from "@/lib/data";
import { fmtDateTime, lastDayLabels } from "@/lib/format";

export default async function AdminHome() {
  const [o, alerts] = await Promise.all([adminOverview(), listAlerts()]);
  const open = alerts.filter((a) => a.status !== "resolved").slice(0, 5);
  const riskTotal = o.risk.low + o.risk.mid + o.risk.high || 1;
  const labels = lastDayLabels(o.daily.length);
  const days = o.daily.map((v, i) => ({ label: labels[i], value: v }));

  return (
    <>
      <PageHeader title="운영 현황" description="최근 14일 기준 서비스 이용과 위험 신호를 한눈에 봐요." />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8">
        <dl className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-surface p-5">
            <dt className="text-sm text-muted">전체 가입자</dt>
            <dd className="mt-1 text-3xl font-bold">{o.users.toLocaleString()}<span className="text-base font-normal text-muted">명</span></dd>
          </div>
          <div className="bg-surface p-5">
            <dt className="text-sm text-muted">오늘 상담</dt>
            <dd className="mt-1 text-3xl font-bold">{o.sessionsToday}<span className="text-base font-normal text-muted">건</span></dd>
          </div>
          <div className="bg-surface p-5">
            <dt className="text-sm text-muted">처리 대기 위기 알림</dt>
            <dd className={`mt-1 text-3xl font-bold ${o.openAlerts ? "text-danger" : ""}`}>
              {o.openAlerts}<span className="text-base font-normal text-muted">건</span>
            </dd>
          </div>
          <div className="bg-surface p-5">
            <dt className="text-sm text-muted">평균 기분 점수</dt>
            <dd className="mt-1 text-3xl font-bold">{o.avgMood || "-"}<span className="text-base font-normal text-muted"> / 10</span></dd>
          </div>
        </dl>

        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <Panel title="일별 상담 수">
            <LineChart title="최근 14일 일별 상담 수" data={days} min={0} max={Math.max(10, Math.ceil(Math.max(...o.daily) / 10) * 10)} unit="건" />
          </Panel>
          <Panel title="세션 위험도 분포">
            <div className="flex h-3 overflow-hidden rounded-full bg-surface-2">
              <span className="bg-brand" style={{ width: `${(o.risk.low / riskTotal) * 100}%` }} />
              <span className="border-l-2 border-surface bg-accent" style={{ width: `${(o.risk.mid / riskTotal) * 100}%` }} />
              <span className="border-l-2 border-surface bg-danger" style={{ width: `${(o.risk.high / riskTotal) * 100}%` }} />
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {(
                [
                  ["low", "안정", "bg-brand"],
                  ["mid", "주의", "bg-accent"],
                  ["high", "위기", "bg-danger"],
                ] as const
              ).map(([k, label, color]) => (
                <li key={k} className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${color}`} />
                    {label}
                  </span>
                  <span className="tabular-nums">
                    {o.risk[k]}건 <span className="text-muted">({Math.round((o.risk[k] / riskTotal) * 100)}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel
          title="처리가 필요한 위기 알림"
          action={<Link href="/admin/alerts" className="text-sm text-brand hover:underline">전체 보기</Link>}
        >
          {open.length ? (
            <ul className="divide-y divide-line">
              {open.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.session_title ?? "제목 없는 상담"}</p>
                    <p className="text-xs text-muted">{a.nickname ?? "익명"} · {fmtDateTime(a.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={a.risk_level} />
                    <span className={`text-xs ${a.status === "new" ? "font-semibold text-danger" : "text-muted"}`}>
                      {a.status === "new" ? "새 알림" : "확인함"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">처리할 위기 알림이 없어요.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
