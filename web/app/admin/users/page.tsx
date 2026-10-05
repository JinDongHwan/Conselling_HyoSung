import Link from "next/link";
import { PageHeader, RiskBadge } from "@/components/PageHeader";
import { isBanned } from "@/lib/auth";
import { POLICY_VERSION } from "@/lib/company";
import { listUsers } from "@/lib/data";
import { fmtDate, fmtDateTime, PROVIDER_LABEL } from "@/lib/format";
import type { AdminUser } from "@/lib/types";
import { StatusBadges } from "./StatusBadges";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "admin", label: "관리자" },
  { key: "suspended", label: "정지" },
  { key: "high", label: "최근 위기" },
  { key: "consent", label: "약관 재동의 필요" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const matchFilter: Record<FilterKey, (u: AdminUser) => boolean> = {
  all: () => true,
  admin: (u) => u.role === "admin",
  suspended: (u) => isBanned(u.banned_until),
  high: (u) => u.last_risk === "high",
  consent: (u) => u.policy_version !== POLICY_VERSION,
};

export default async function UsersPage(props: PageProps<"/admin/users">) {
  const { q, f } = await props.searchParams;
  const query = typeof q === "string" ? q.trim().toLowerCase() : "";
  const filter: FilterKey = FILTERS.some((x) => x.key === f) ? (f as FilterKey) : "all";

  const all = await listUsers();
  const users = all
    .filter(matchFilter[filter])
    .filter((u) => !query || (u.nickname ?? "").toLowerCase().includes(query) || (u.email ?? "").toLowerCase().includes(query));

  const href = (key: FilterKey) => {
    const sp = new URLSearchParams();
    if (key !== "all") sp.set("f", key);
    if (query) sp.set("q", query);
    const s = sp.toString();
    return `/admin/users${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="사용자 관리" description="이름을 누르면 상세 정보와 권한 변경·이용 정지·계정 삭제를 할 수 있어요." />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <form className="flex max-w-md gap-2">
          {filter !== "all" && <input type="hidden" name="f" value={filter} />}
          <label htmlFor="q" className="sr-only">이름 또는 이메일 검색</label>
          <input id="q" name="q" defaultValue={query} placeholder="이름 또는 이메일로 찾기" className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-brand" />
          <button className="rounded-xl bg-dark px-5 text-sm font-semibold text-page">검색</button>
        </form>

        <nav aria-label="사용자 필터" className="mt-4 flex flex-wrap gap-2 text-sm">
          {FILTERS.map((x) => {
            const count = all.filter(matchFilter[x.key]).length;
            const active = x.key === filter;
            return (
              <Link
                key={x.key}
                href={href(x.key)}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-3.5 py-1.5 font-semibold ${active ? "border-brand bg-brand-soft text-brand-strong" : "border-line text-muted hover:border-brand"}`}
              >
                {x.label} <span className="tabular-nums">{count}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">이름</th>
                <th className="px-5 py-3 font-medium">이메일 · 가입 방식</th>
                <th className="px-5 py-3 font-medium">가입일</th>
                <th className="px-5 py-3 font-medium">마지막 로그인</th>
                <th className="px-5 py-3 text-right font-medium">상담 수</th>
                <th className="px-5 py-3 font-medium">최근 위험도</th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3"><span className="sr-only">관리</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2/60">
                  <td className="px-5 py-3 font-medium">
                    <Link href={`/admin/users/${u.id}`} className="hover:text-brand hover:underline">{u.nickname ?? "이름 없음"}</Link>
                  </td>
                  <td className="px-5 py-3 text-muted">
                    {u.email ?? "-"}
                    <span className="block text-xs">{PROVIDER_LABEL[u.provider ?? ""] ?? u.provider ?? ""}</span>
                  </td>
                  <td className="px-5 py-3 text-muted">{fmtDate(u.created_at)}</td>
                  <td className="px-5 py-3 text-muted">{u.last_sign_in_at ? fmtDateTime(u.last_sign_in_at) : "-"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{u.session_count}</td>
                  <td className="px-5 py-3"><RiskBadge risk={u.last_risk} /></td>
                  <td className="px-5 py-3"><StatusBadges user={u} /></td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/users/${u.id}`} className="rounded-md border border-line px-2.5 py-1 text-xs font-semibold hover:border-brand">관리</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!users.length && <p className="p-8 text-center text-muted">해당하는 사용자가 없어요.</p>}
        </div>
      </div>
    </>
  );
}
