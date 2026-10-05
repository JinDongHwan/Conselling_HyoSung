import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSession } from "@/app/actions";
import { RiskBadge } from "@/components/PageHeader";
import { ReplyText } from "@/components/ReplyText";
import { requireProfile } from "@/lib/auth";
import { getSession } from "@/lib/data";
import { fmtDate, fmtDateTime } from "@/lib/format";

export default async function RecordDetail(props: PageProps<"/dashboard/records/[id]">) {
  const profile = await requireProfile();
  const { id } = await props.params;
  const data = await getSession(id);
  if (!data || data.session.user_id !== profile.id) notFound();
  const { session, messages } = data;
  const remove = deleteSession.bind(null, session.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <Link href="/dashboard/records" className="text-sm text-muted hover:text-ink">과거 기록으로</Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted">{fmtDate(session.created_at)}</p>
        <RiskBadge risk={session.risk_level} />
      </div>
      <h1 className="mt-2 text-3xl font-bold">{session.title ?? "제목 없는 상담"}</h1>

      {session.summary && (
        <section className="mt-6 rounded-2xl bg-brand-soft p-5">
          <p className="text-sm font-semibold text-brand-strong">AI 요약</p>
          <p className="mt-2 leading-relaxed">{session.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {session.topics?.map((t) => (
              <span key={t} className="rounded-md bg-surface px-2 py-0.5">{t}</span>
            ))}
          </div>
        </section>
      )}

      {session.mood_start && session.mood_end && (
        <p className="mt-4 text-sm text-muted">
          상담 전 기분 <b className="text-ink">{session.mood_start}점</b>, 상담 후 <b className="text-ink">{session.mood_end}점</b>
        </p>
      )}

      <section className="mt-8">
        <h2 className="font-semibold">대화 내용</h2>
        {messages.length ? (
          <ol className="mt-4 space-y-3">
            {messages.map((m) => (
              <li key={m.id} className={m.role === "user" ? "flex flex-col items-end" : ""}>
                <div
                  className={`max-w-[min(90%,40rem)] rounded-2xl px-4 py-2.5 leading-7 whitespace-pre-wrap ${
                    m.role === "user" ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm border border-line bg-surface"
                  }`}
                >
                  {m.role === "assistant" ? <ReplyText text={m.content} /> : m.content}
                </div>
                <span className="mt-1 block text-xs text-muted">{fmtDateTime(m.created_at)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-muted">저장된 대화가 없어요.</p>
        )}
      </section>

      <form action={remove} className="mt-12 border-t border-line pt-6">
        <p className="text-sm text-muted">이 상담의 대화와 요약을 모두 지웁니다. 되돌릴 수 없어요.</p>
        <button className="mt-3 rounded-lg border border-danger/50 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-soft">
          이 기록 삭제
        </button>
      </form>
    </div>
  );
}
