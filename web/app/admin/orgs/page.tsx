import { PageHeader, Panel } from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";
import { fmtDate, isPast, ORG_TYPE_LABEL } from "@/lib/format";
import { listOrgs } from "@/lib/orgs";
import { CodeActiveToggle, CopyCode, CreateCodeForm, CreateOrgForm, OrgPolicyControls } from "./OrgForms";

// 관리자: 기관(교육청·학교·센터·기업 등) 등록과 가입 코드 발급
export default async function OrgsPage() {
  await requireAdmin();
  const orgs = await listOrgs();
  const names = new Map(orgs.map((o) => [o.id, o.name]));

  return (
    <>
      <PageHeader
        title="기관·가입 코드"
        description="학교·교육청·기업 등 기관을 등록하고 가입 코드를 발급해요. 만 19세 미만은 기관 가입 코드로만 가입할 수 있어요."
      />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8">
        <Panel title="새 기관 등록">
          {DEMO_MODE ? <p className="text-sm text-muted">데모 모드에서는 사용할 수 없어요.</p> : <CreateOrgForm parents={orgs.map((o) => ({ id: o.id, name: o.name }))} />}
        </Panel>

        {orgs.length === 0 && !DEMO_MODE && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-muted">아직 등록된 기관이 없어요.</p>}

        {orgs.map((o) => (
          <Panel
            key={o.id}
            title={o.name}
            action={
              <span className="text-sm text-muted">
                {ORG_TYPE_LABEL[o.type]}
                {o.parent_id && ` · ${names.get(o.parent_id) ?? "상위 기관"} 소속`} · 가입 {o.member_count}명
              </span>
            }
          >
            <OrgPolicyControls orgId={o.id} active={o.active} allowMinors={o.allow_minors} allowUnder14={o.allow_under14} />

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line text-muted">
                  <tr>
                    <th className="py-2 pr-4 font-medium">가입 코드</th>
                    <th className="py-2 pr-4 font-medium">이름표</th>
                    <th className="py-2 pr-4 font-medium">유효기간</th>
                    <th className="py-2 pr-4 font-medium">사용</th>
                    <th className="py-2 pr-4 font-medium">상태</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {o.codes.map((c) => {
                    const expired = isPast(c.expires_at);
                    const full = c.max_uses !== null && c.used_count >= c.max_uses;
                    const usable = c.active && !expired && !full;
                    return (
                      <tr key={c.code}>
                        <td className="py-2 pr-4"><CopyCode code={c.code} /></td>
                        <td className="py-2 pr-4 text-muted">{c.label ?? "-"}</td>
                        <td className="py-2 pr-4 text-muted">{c.expires_at ? `${fmtDate(c.expires_at)}까지` : "제한 없음"}</td>
                        <td className="py-2 pr-4 tabular-nums">
                          {c.used_count}
                          {c.max_uses !== null && ` / ${c.max_uses}`}명
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${usable ? "bg-brand-soft text-brand-strong" : "bg-surface-2 text-muted"}`}>
                            {!c.active ? "사용 중지" : expired ? "기간 만료" : full ? "인원 마감" : "사용 가능"}
                          </span>
                        </td>
                        <td className="py-2 text-right"><CodeActiveToggle code={c.code} active={c.active} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {o.codes.length === 0 && <p className="py-3 text-sm text-muted">아직 발급한 가입 코드가 없어요.</p>}
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <CreateCodeForm orgId={o.id} />
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
