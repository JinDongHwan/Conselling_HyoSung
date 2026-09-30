import Link from "next/link";
import { PageHeader, RiskBadge } from "@/components/PageHeader";
import { requireProfile } from "@/lib/auth";
import { listSessions } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default async function RecordsPage(props: PageProps<"/dashboard/records">) {
  const profile = await requireProfile();
  const { q, topic } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const topicFilter = typeof topic === "string" ? topic : "";

  const all = await listSessions(profile.id, 200);
  const topics = [...new Set(all.flatMap((s) => s.topics ?? []))];
  const sessions = all.filter(
    (s) =>
      (!query || `${s.title ?? ""} ${s.summary ?? ""}`.includes(query)) &&
      (!topicFilter || s.topics?.includes(topicFilter)),
  );

  return (
    <>
      <PageHeader title="과거 기록" description="지난 상담의 요약을 다시 보고, 필요 없는 기록은 지울 수 있어요." />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8">
        <form className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="q" className="sr-only">기록 검색</label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="제목이나 요약으로 찾기"
            className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-brand"
          />
          {topicFilter && <input type="hidden" name="topic" value={topicFilter} />}
          <button className="rounded-xl bg-dark px-5 py-2.5 text-sm font-semibold text-page">검색</button>
        </form>

        {topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Link
              href={query ? `?q=${encodeURIComponent(query)}` : "?"}
              className={`rounded-full px-3 py-1 ${!topicFilter ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-ink"}`}
            >
              전체
            </Link>
            {topics.map((t) => (
              <Link
                key={t}
                href={`?${new URLSearchParams({ ...(query && { q: query }), topic: t })}`}
                className={`rounded-full px-3 py-1 ${topicFilter === t ? "bg-brand text-white" : "bg-surface-2 text-muted hover:text-ink"}`}
              >
                {t}
              </Link>
            ))}
          </div>
        )}

        {sessions.length ? (
          <ul className="mt-6 space-y-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/dashboard/records/${s.id}`}
                  className="block rounded-2xl border border-line bg-surface p-5 hover:border-brand"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-muted">{fmtDate(s.created_at)}</p>
                    <RiskBadge risk={s.risk_level} />
                  </div>
                  <p className="mt-1.5 text-lg font-semibold">{s.title ?? "제목 없는 상담"}</p>
                  {s.summary && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{s.summary}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {s.topics?.map((t) => (
                      <span key={t} className="rounded-md bg-surface-2 px-2 py-0.5">{t}</span>
                    ))}
                    {s.mood_start && s.mood_end && (
                      <span className="ml-auto text-muted">
                        기분 {s.mood_start}점에서 {s.mood_end}점으로
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center">
            <p className="text-muted">{query || topicFilter ? "조건에 맞는 기록이 없어요." : "아직 상담 기록이 없어요."}</p>
            <Link href="/dashboard/counsel" className="mt-4 inline-block font-semibold text-brand hover:underline">
              상담 시작하기
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
