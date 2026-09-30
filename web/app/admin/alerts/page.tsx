import Link from "next/link";
import { updateAlert } from "@/app/actions";
import { CrisisCard } from "@/components/CrisisCard";
import { PageHeader, RiskBadge } from "@/components/PageHeader";
import { listAlerts } from "@/lib/data";
import { fmtDateTime } from "@/lib/format";

const STATUS = { new: "새 알림", checked: "확인함", resolved: "처리 완료" } as const;

export default async function AlertsPage(props: PageProps<"/admin/alerts">) {
  const { status } = await props.searchParams;
  const filter = typeof status === "string" && status in STATUS ? (status as keyof typeof STATUS) : null;
  const alerts = (await listAlerts()).filter((a) => !filter || a.status === filter);

  return (
    <>
      <PageHeader title="위기 알림" description="자해·자살 위험이 감지된 상담이에요. 확인 후 조치 내용을 남겨 주세요." />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        <details className="mb-6">
          <summary className="cursor-pointer text-sm font-medium text-brand">사용자에게 안내하는 위기 연락처 보기</summary>
          <div className="mt-3"><CrisisCard compact /></div>
        </details>

        <div className="flex flex-wrap gap-2 text-sm">
          {[["", "전체"], ...Object.entries(STATUS)].map(([k, label]) => (
            <Link
              key={k}
              href={k ? `?status=${k}` : "?"}
              className={`rounded-full px-3 py-1 ${(filter ?? "") === k ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-ink"}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {alerts.length ? (
          <ul className="mt-6 space-y-3">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`rounded-2xl border bg-surface p-5 ${a.status === "new" ? "border-danger/50" : "border-line"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">{a.session_title ?? "제목 없는 상담"}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {a.nickname ?? "익명"} · {fmtDateTime(a.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={a.risk_level} />
                    <span className={`text-sm ${a.status === "new" ? "font-semibold text-danger" : "text-muted"}`}>{STATUS[a.status]}</span>
                  </div>
                </div>

                <form action={updateAlert} className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input type="hidden" name="id" value={a.id} />
                  <label htmlFor={`memo-${a.id}`} className="sr-only">조치 메모</label>
                  <input
                    id={`memo-${a.id}`}
                    name="memo"
                    defaultValue={a.memo ?? ""}
                    maxLength={500}
                    placeholder="조치 내용 (예: 109 안내, 센터 연계)"
                    className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <select
                    name="status"
                    defaultValue={a.status === "new" ? "checked" : a.status}
                    aria-label="처리 상태"
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  >
                    <option value="new">새 알림</option>
                    <option value="checked">확인함</option>
                    <option value="resolved">처리 완료</option>
                  </select>
                  <button className="rounded-lg bg-dark px-4 py-2 text-sm font-semibold text-page">저장</button>
                </form>
                <Link href={`/admin/sessions/${a.session_id}`} className="mt-3 inline-block text-sm text-brand hover:underline">
                  상담 내용 확인 (열람 기록이 남습니다)
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-10 text-center text-muted">해당하는 알림이 없어요.</p>
        )}
      </div>
    </>
  );
}
