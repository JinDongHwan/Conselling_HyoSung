import Link from "next/link";
import { notFound } from "next/navigation";
import { LineChart } from "@/components/charts";
import { PageHeader, Panel, RiskBadge } from "@/components/PageHeader";
import { bandOf } from "@/lib/assessments";
import { isBanned, requireAdmin } from "@/lib/auth";
import { POLICY_VERSION } from "@/lib/company";
import { getUserDetail } from "@/lib/data";
import { auditLabel, fmtDate, fmtDateTime, fmtShort, PROVIDER_LABEL } from "@/lib/format";
import { StatusBadges } from "../StatusBadges";
import { TempPasswordButton } from "../TempPasswordButton";
import { UserActions } from "./UserActions";

// 관리자: 사용자 상세. 대화 원문은 여기 보이지 않고, 상담을 누르면 열람 규칙(위기 또는 동의)에 따라 열린다.
export default async function AdminUserPage(props: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdmin();
  const { id } = await props.params;
  const detail = await getUserDetail(id);
  if (!detail) notFound();
  const { user, sessions, moods, assessments, audit } = detail;
  const name = user.nickname ?? user.email ?? "이름 없음";
  const suspended = isBanned(user.banned_until);

  const info: [string, React.ReactNode][] = [
    ["이메일", user.email ?? "-"],
    ["가입 방식", PROVIDER_LABEL[user.provider ?? ""] ?? user.provider ?? "-"],
    ["가입일", fmtDate(user.created_at)],
    ["마지막 로그인", user.last_sign_in_at ? fmtDateTime(user.last_sign_in_at) : "-"],
    ["출생연도", user.birth_year ?? "시작 설정 전"],
    ["상담 수", `${user.session_count}회`],
    [
      "약관 동의",
      user.terms_agreed_at ? (
        <>
          {fmtDate(user.terms_agreed_at)}{" "}
          <span className={user.policy_version === POLICY_VERSION ? "text-muted" : "text-accent"}>
            ({user.policy_version === POLICY_VERSION ? "최신 버전" : `이전 버전 ${user.policy_version}`})
          </span>
        </>
      ) : (
        "기록 없음"
      ),
    ],
    ["대화 원문 열람 동의", user.consent_admin_view ? "동의" : "미동의"],
  ];

  return (
    <>
      <PageHeader
        title={name}
        description="사용자 정보와 상담 이용 현황이에요. 대화 원문은 위기 상황이거나 사용자가 동의한 경우에만 열 수 있어요."
        action={<Link href="/admin/users" className="text-sm text-muted hover:text-ink">← 사용자 목록</Link>}
      />
      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-8 lg:grid-cols-[1fr_1fr]">
        <Panel title="기본 정보" action={<StatusBadges user={user} />}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
            {info.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="계정 관리">
          <UserActions userId={user.id} name={name} role={user.role} suspended={suspended} isSelf={user.id === admin.id} />
          {user.email && user.provider === "email" && user.id !== admin.id && (
            <div className="mt-5 flex flex-wrap items-start justify-between gap-3 border-t border-line pt-5">
              <div>
                <p className="font-medium">임시 비밀번호</p>
                <p className="text-sm text-muted">비밀번호를 잊은 사용자에게 발급해요.</p>
              </div>
              <TempPasswordButton userId={user.id} label={name} />
            </div>
          )}
        </Panel>

        <Panel title={`상담 기록 ${sessions.length}건`} className="lg:col-span-2">
          {sessions.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line text-muted">
                  <tr>
                    <th className="py-2 pr-4 font-medium">날짜</th>
                    <th className="py-2 pr-4 font-medium">제목 · 요약</th>
                    <th className="py-2 pr-4 font-medium">주제</th>
                    <th className="py-2 pr-4 font-medium">기분</th>
                    <th className="py-2 font-medium">위험도</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sessions.map((s) => (
                    <tr key={s.id} className="align-top">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-muted">{fmtDateTime(s.created_at)}</td>
                      <td className="py-2.5 pr-4">
                        <Link href={`/admin/sessions/${s.id}`} className="font-medium hover:text-brand hover:underline">{s.title ?? "제목 없는 상담"}</Link>
                        {s.summary && <p className="mt-0.5 line-clamp-2 text-muted">{s.summary}</p>}
                      </td>
                      <td className="py-2.5 pr-4 text-muted">{s.topics?.join(", ") || "-"}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap tabular-nums text-muted">
                        {s.mood_start ?? "-"} → {s.mood_end ?? "-"}
                      </td>
                      <td className="py-2.5"><RiskBadge risk={s.risk_level} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">아직 상담 기록이 없어요.</p>
          )}
        </Panel>

        <Panel title="기분 점수 (최근 90일)">
          {moods.length ? (
            <LineChart title="최근 90일 기분 점수" data={moods.map((m) => ({ label: fmtShort(m.created_at), value: m.score }))} min={1} max={10} height={160} />
          ) : (
            <p className="text-sm text-muted">기분 기록이 없어요.</p>
          )}
        </Panel>

        <Panel title="자가진단">
          {assessments.length ? (
            <ul className="divide-y divide-line text-sm">
              {[...assessments].reverse().map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    {a.type} <span className="text-muted">· {fmtDate(a.created_at)}</span>
                  </span>
                  <span className="tabular-nums">
                    {a.score}점 <span className="text-muted">({bandOf(a.type, a.score)})</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">자가진단 기록이 없어요.</p>
          )}
        </Panel>

        <Panel title="관리 기록" className="lg:col-span-2">
          {audit.length ? (
            <ul className="divide-y divide-line text-sm">
              {audit.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 py-2">
                  <span>{auditLabel(l.action)}</span>
                  <span className="text-muted">
                    {l.admin_name ?? "관리자"} · {fmtDateTime(l.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">이 사용자에 대한 관리 기록이 없어요.</p>
          )}
        </Panel>
      </div>
    </>
  );
}
