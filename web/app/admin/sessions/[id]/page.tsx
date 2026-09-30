import Link from "next/link";
import { logAdminView } from "@/app/actions";
import { RiskBadge } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { getSession } from "@/lib/data";
import { fmtDate, fmtDateTime } from "@/lib/format";

// 관리자 상담 열람: RLS가 위기(high) 세션 또는 사용자가 동의한 경우에만 원문을 돌려준다
export default async function AdminSessionPage(props: PageProps<"/admin/sessions/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const data = await getSession(id);
  await logAdminView(id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <Link href="/admin/alerts" className="text-sm text-muted hover:text-ink">위기 알림으로</Link>
      {!data ? (
        <p className="mt-8 rounded-2xl border border-dashed border-line p-8 text-center text-muted">
          상담을 찾을 수 없어요. 데모 모드이거나 열람 권한이 없는 상담입니다.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3">
            <p className="text-sm text-muted">{fmtDate(data.session.created_at)}</p>
            <RiskBadge risk={data.session.risk_level} />
          </div>
          <h1 className="mt-2 text-3xl font-bold">{data.session.title ?? "제목 없는 상담"}</h1>
          {data.session.summary && (
            <p className="mt-4 rounded-2xl bg-brand-soft p-5 leading-relaxed">{data.session.summary}</p>
          )}
          <h2 className="mt-8 font-semibold">대화 원문</h2>
          {data.messages.length ? (
            <ol className="mt-4 space-y-3">
              {data.messages.map((m) => (
                <li key={m.id} className="rounded-xl border border-line bg-surface p-4">
                  <p className="text-xs text-muted">
                    {m.role === "user" ? "사용자" : "AI"} · {fmtDateTime(m.created_at)}
                    {m.risk_flag === "high" && <span className="ml-2 font-semibold text-danger">위험 신호</span>}
                  </p>
                  <p className="mt-1.5 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-muted">
              원문 열람 권한이 없어요. 사용자가 동의하지 않았고 위기 세션이 아닌 경우 요약만 볼 수 있습니다.
            </p>
          )}
        </>
      )}
    </div>
  );
}
