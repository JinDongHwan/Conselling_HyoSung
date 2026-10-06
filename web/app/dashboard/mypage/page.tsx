import Link from "next/link";
import { deleteAccount, saveProfile, signOut } from "@/app/actions";
import { PageHeader, Panel } from "@/components/PageHeader";
import { PasswordForm } from "@/components/PasswordForm";
import { requireProfile } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";
import { listSessions } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { AGE_BAND_LABEL, GUARDIAN_STATUS_LABEL, profileAgeBand } from "@/lib/age";
import { getOrg, latestGuardianConsent } from "@/lib/orgs";

export default async function MyPage() {
  const profile = await requireProfile();
  const [sessions, org, guardian] = await Promise.all([listSessions(profile.id, 200), getOrg(profile.org_id), latestGuardianConsent(profile.id)]);
  const band = profileAgeBand(profile);

  return (
    <>
      <PageHeader title="마이페이지" description="상담 방식과 개인정보 설정을 관리해요." />
      <div className="mx-auto grid max-w-4xl gap-5 px-4 py-6 sm:px-8">
        <Panel>
          <div className="flex flex-wrap items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-2xl font-bold text-brand-strong">
              {(profile.nickname ?? "나").slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="text-lg font-semibold">{profile.nickname ?? "이름 없음"}</p>
              <p className="truncate text-sm text-muted">
                {profile.email ?? "카카오 계정"} · {fmtDate(profile.created_at)} 가입 · 상담 {sessions.length}회
              </p>
            </div>
          </div>
        </Panel>

        <form action={saveProfile}>
          <Panel title="상담 설정">
            <label className="block">
              <span className="text-sm font-medium">불러 드릴 이름</span>
              <input
                name="nickname"
                defaultValue={profile.nickname ?? ""}
                maxLength={20}
                className="mt-1 w-full max-w-sm rounded-xl border border-line bg-surface px-3.5 py-2.5 outline-none focus:border-brand"
              />
            </label>

            <fieldset className="mt-6">
              <legend className="text-sm font-medium">AI 말투</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { v: "warm", t: "따뜻하게", d: "감정을 먼저 충분히 알아주는 말투" },
                  { v: "plain", t: "담백하게", d: "짧게 공감하고 실용적으로 정리하는 말투" },
                ].map((o) => (
                  <label key={o.v} className="cursor-pointer">
                    <input type="radio" name="tone_pref" value={o.v} defaultChecked={profile.tone_pref === o.v} className="peer sr-only" />
                    <span className="block rounded-xl border border-line p-4 peer-checked:border-brand peer-checked:bg-brand-soft peer-focus-visible:ring-2 peer-focus-visible:ring-accent">
                      <span className="font-semibold">{o.t}</span>
                      <span className="mt-0.5 block text-sm text-muted">{o.d}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {band === "adult" && (
            <label className="mt-6 flex items-start gap-3 rounded-xl bg-surface-2 p-4">
              <input type="checkbox" name="consent_admin_view" defaultChecked={profile.consent_admin_view} className="mt-1 accent-brand" />
              <span className="text-sm">
                <span className="font-medium">관리자가 내 대화 원문을 볼 수 있도록 허용</span>
                <span className="mt-0.5 block text-muted">
                  끄면 관리자는 AI 요약과 위험도만 볼 수 있어요. 위기 상황의 대화는 안전을 위해 이 설정과 관계없이 열람될 수 있습니다.
                </span>
              </span>
            </label>
            )}

            <button className="mt-6 rounded-xl bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-strong">
              저장하기
            </button>
            {DEMO_MODE && <p className="mt-2 text-xs text-muted">데모 모드에서는 저장되지 않아요.</p>}
          </Panel>
        </form>

        {profile.email && (
          <Panel title="비밀번호 변경">
            <p className="mb-4 text-sm text-muted">관리자에게 임시 비밀번호를 받았다면 여기서 새 비밀번호로 바꿔 주세요.</p>
            {DEMO_MODE ? <p className="text-sm text-muted">데모 모드에서는 바꿀 수 없어요.</p> : <PasswordForm />}
          </Panel>
        )}

        <Panel title="가입 정보와 동의 내역">
          <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-muted">나이 구간</dt>
            <dd>{band ? AGE_BAND_LABEL[band] : "-"}</dd>
            <dt className="text-muted">소속 기관</dt>
            <dd>{org?.name ?? "개인 가입"}</dd>
            {band === "under14" && (
              <>
                <dt className="text-muted">보호자 동의</dt>
                <dd>{guardian ? GUARDIAN_STATUS_LABEL[guardian.status] : "요청 없음"}</dd>
              </>
            )}
          </dl>
          <p className="text-sm">
            {profile.terms_agreed_at ? (
              <>
                {fmtDate(profile.terms_agreed_at)}에 이용약관, 개인정보 수집·이용, 민감정보 처리에 동의했어요.
                <span className="ml-1 text-muted">(약관 버전 {profile.policy_version})</span>
              </>
            ) : (
              <span className="text-muted">동의 기록이 없어요.</span>
            )}
          </p>
          <p className="mt-3 flex gap-4 text-sm font-semibold text-brand">
            <Link href="/terms" className="hover:underline">이용약관 보기</Link>
            <Link href="/privacy" className="hover:underline">개인정보처리방침 보기</Link>
          </p>
        </Panel>

        <Panel title="계정">
          <form action={signOut}>
            <button className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold hover:border-brand">로그아웃</button>
          </form>
          <div className="mt-6 border-t border-line pt-6">
            <p className="font-medium text-danger">탈퇴하고 모든 데이터 삭제</p>
            <p className="mt-1 text-sm text-muted">상담 기록, 기분 기록, 자가진단 결과가 모두 즉시 삭제되며 되돌릴 수 없어요.</p>
            <form action={deleteAccount} className="mt-3">
              <button className="rounded-xl border border-danger/50 px-5 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft">
                탈퇴하기
              </button>
            </form>
          </div>
        </Panel>
      </div>
    </>
  );
}
