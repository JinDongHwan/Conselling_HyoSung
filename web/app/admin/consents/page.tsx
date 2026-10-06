import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { GUARDIAN_STATUS_LABEL, type GuardianStatus } from "@/lib/age";
import { requireAdmin } from "@/lib/auth";
import { fmtDateTime } from "@/lib/format";
import { listGuardianConsents } from "@/lib/orgs";
import { ConsentActions } from "./ConsentActions";

const TABS: { key: "all" | GuardianStatus; label: string }[] = [
  { key: "submitted", label: "확인 대기" },
  { key: "requested", label: "요청됨" },
  { key: "confirmed", label: "완료" },
  { key: "rejected", label: "거절" },
  { key: "withdrawn", label: "철회" },
  { key: "all", label: "전체" },
];

const STATUS_STYLE: Record<GuardianStatus, string> = {
  requested: "bg-surface-2 text-muted",
  submitted: "bg-accent-soft text-ink",
  confirmed: "bg-brand-soft text-brand-strong",
  rejected: "bg-danger-soft text-danger",
  withdrawn: "bg-danger-soft text-danger",
};

// 관리자: 만 14세 미만 보호자 동의 요청 관리
export default async function ConsentsPage(props: PageProps<"/admin/consents">) {
  await requireAdmin();
  const { s } = await props.searchParams;
  const tab = TABS.find((t) => t.key === s)?.key ?? "submitted";
  const all = await listGuardianConsents();
  const rows = tab === "all" ? all : all.filter((c) => c.status === tab);

  return (
    <>
      <PageHeader
        title="보호자 동의"
        description="만 14세 미만 학생의 보호자 동의를 확인해요. 온라인 제출 건은 보호자 연락처로 확인한 뒤 '확인 완료'를 눌러 주세요."
      />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <nav aria-label="상태 필터" className="flex flex-wrap gap-2 text-sm">
          {TABS.map((t) => {
            const count = t.key === "all" ? all.length : all.filter((c) => c.status === t.key).length;
            return (
              <Link
                key={t.key}
                href={`/admin/consents?s=${t.key}`}
                aria-current={t.key === tab ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 font-semibold ${t.key === tab ? "border-brand bg-brand-soft text-brand-strong" : "border-line text-muted hover:border-brand"}`}
              >
                {t.label} <span className="tabular-nums">{count}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">학생</th>
                <th className="px-5 py-3 font-medium">기관</th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3 font-medium">보호자 (관계 · 연락처)</th>
                <th className="px-5 py-3 font-medium">방법</th>
                <th className="px-5 py-3 font-medium">요청 · 제출</th>
                <th className="px-5 py-3 font-medium">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/users/${c.user_id}`} className="hover:text-brand hover:underline">{c.nickname ?? "이름 없음"}</Link>
                  </td>
                  <td className="px-5 py-3 text-muted">{c.org_name ?? "-"}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[c.status]}`}>{GUARDIAN_STATUS_LABEL[c.status]}</span>
                    {c.memo && <p className="mt-1 max-w-48 text-xs text-muted">{c.memo}</p>}
                  </td>
                  <td className="px-5 py-3">
                    {c.guardian_name ? (
                      <>
                        {c.guardian_name} <span className="text-muted">({c.guardian_relation})</span>
                        {c.guardian_contact && <span className="block text-xs text-muted">{c.guardian_contact}</span>}
                      </>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted">{c.method === "paper" ? "서면" : c.method === "online" ? "온라인" : "-"}</td>
                  <td className="px-5 py-3 text-xs text-muted">
                    {fmtDateTime(c.created_at)}
                    {c.submitted_at && <span className="block">제출 {fmtDateTime(c.submitted_at)}</span>}
                  </td>
                  <td className="px-5 py-3">
                    <ConsentActions consentId={c.id} status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="p-8 text-center text-muted">해당하는 요청이 없어요.</p>}
        </div>
      </div>
    </>
  );
}
