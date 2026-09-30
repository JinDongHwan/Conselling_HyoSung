import Link from "next/link";
import { saveMood } from "@/app/actions";
import { LineChart } from "@/components/charts";
import { Panel, RiskBadge } from "@/components/PageHeader";
import { requireProfile } from "@/lib/auth";
import { listMoods, listSessions } from "@/lib/data";
import { fmtDate, fmtShort, greeting } from "@/lib/format";

export default async function DashboardHome() {
  const profile = await requireProfile();
  const [sessions, moods] = await Promise.all([listSessions(profile.id, 3), listMoods(profile.id, 14)]);
  const todayKey = new Date().toDateString();
  const todayMood = moods.findLast((m) => new Date(m.created_at).toDateString() === todayKey);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10">
      <p className="text-sm text-muted">{fmtDate(new Date().toISOString())}</p>
      <h1 className="mt-1 text-3xl font-bold">
        {greeting()}, {profile.nickname ?? "반가워요"}님
      </h1>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <section className="flex flex-col justify-between rounded-[20px] bg-brand p-6 text-white sm:p-8">
          <div>
            <p className="text-2xl leading-snug font-bold">
              오늘 마음에 남은 일이 있나요?
            </p>
            <p className="mt-2 text-sm opacity-85">한 줄만 적어도 괜찮아요. 대화는 나만 볼 수 있어요.</p>
          </div>
          <Link
            href="/dashboard/counsel"
            className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-brand hover:bg-brand-soft"
          >
            <span className="inline-block size-2 rounded-full bg-accent" />
            상담 시작하기
          </Link>
        </section>

        <Panel title="오늘의 기분">
          {todayMood ? (
            <p className="text-sm text-muted">
              오늘은 <b className="text-3xl text-ink">{todayMood.score}</b> / 10 으로 기록했어요.
            </p>
          ) : (
            <form action={saveMood}>
              <p className="text-sm text-muted">1은 아주 힘듦, 10은 아주 좋음이에요.</p>
              <fieldset className="mt-4 grid grid-cols-5 gap-2">
                <legend className="sr-only">기분 점수</legend>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <label key={n} className="cursor-pointer">
                    <input type="radio" name="score" value={n} required className="peer sr-only" />
                    <span className="block rounded-lg border border-line py-2 text-center text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:font-semibold peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-accent hover:border-brand">
                      {n}
                    </span>
                  </label>
                ))}
              </fieldset>
              <input
                name="note"
                maxLength={300}
                placeholder="한 줄 메모 (선택)"
                className="mt-3 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button className="mt-3 w-full rounded-lg bg-dark px-4 py-2.5 text-sm font-semibold text-page hover:opacity-90">
                기록하기
              </button>
            </form>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Panel
          title="최근 2주 기분"
          action={<Link href="/dashboard/data" className="text-sm text-brand hover:underline">자세히 보기</Link>}
        >
          <LineChart
            title="최근 2주 기분 점수"
            data={moods.map((m) => ({ label: fmtShort(m.created_at), value: m.score }))}
            min={1}
            max={10}
            height={190}
            unit="점"
          />
        </Panel>

        <Panel
          title="최근 상담"
          action={<Link href="/dashboard/records" className="text-sm text-brand hover:underline">전체 보기</Link>}
        >
          {sessions.length ? (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link href={`/dashboard/records/${s.id}`} className="block rounded-xl bg-surface-2 px-4 py-3 hover:ring-1 hover:ring-brand">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{s.title ?? "제목 없는 상담"}</span>
                      <RiskBadge risk={s.risk_level} />
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{fmtDate(s.created_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">아직 상담 기록이 없어요. 첫 이야기를 시작해 보세요.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
