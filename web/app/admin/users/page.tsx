import { setUserRole } from "@/app/actions";
import { PageHeader, RiskBadge } from "@/components/PageHeader";
import { listUsers } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export default async function UsersPage(props: PageProps<"/admin/users">) {
  const { q } = await props.searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const users = (await listUsers()).filter((u) => !query || (u.nickname ?? "").includes(query));

  return (
    <>
      <PageHeader title="사용자 관리" description="상담 이용 현황과 최근 위험도를 확인해요. 대화 내용은 이 화면에 표시되지 않습니다." />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <form className="flex max-w-md gap-2">
          <label htmlFor="q" className="sr-only">이름 검색</label>
          <input id="q" name="q" defaultValue={query} placeholder="이름으로 찾기" className="flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-brand" />
          <button className="rounded-xl bg-dark px-5 text-sm font-semibold text-page">검색</button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">이름</th>
                <th className="px-5 py-3 font-medium">가입일</th>
                <th className="px-5 py-3 font-medium">출생연도</th>
                <th className="px-5 py-3 text-right font-medium">상담 수</th>
                <th className="px-5 py-3 font-medium">최근 위험도</th>
                <th className="px-5 py-3 font-medium">원문 열람 동의</th>
                <th className="px-5 py-3 font-medium">권한</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 font-medium">{u.nickname ?? "이름 없음"}</td>
                  <td className="px-5 py-3 text-muted">{fmtDate(u.created_at)}</td>
                  <td className="px-5 py-3 text-muted">{u.birth_year ?? "-"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{u.session_count}</td>
                  <td className="px-5 py-3"><RiskBadge risk={u.last_risk} /></td>
                  <td className="px-5 py-3">{u.consent_admin_view ? "동의" : <span className="text-muted">미동의</span>}</td>
                  <td className="px-5 py-3">
                    <form action={setUserRole} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} aria-label={`${u.nickname} 권한`} className="rounded-md border border-line bg-surface px-2 py-1">
                        <option value="user">사용자</option>
                        <option value="admin">관리자</option>
                      </select>
                      <button className="text-xs font-semibold text-brand hover:underline">변경</button>
                    </form>
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
