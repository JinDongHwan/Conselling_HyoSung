import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { Logo } from "@/components/Logo";

function countKnowledgeDocs() {
  try {
    const root = path.join(process.cwd(), "..", "knowledge");
    return fs.readdirSync(root, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".md")).length;
  } catch {
    return 0;
  }
}

// ───────── 공통 조각 ─────────

function SectionHead({ eyebrow, title, desc, center = true }: { eyebrow: string; title: React.ReactNode; desc?: React.ReactNode; center?: boolean }) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="text-lg font-bold text-brand sm:text-2xl">{eyebrow}</p>
      <h2 className="mt-3 text-3xl leading-[1.3] font-bold sm:text-5xl sm:leading-[1.25]">{title}</h2>
      {desc && <p className={`mt-5 text-base leading-relaxed text-muted sm:text-lg ${center ? "mx-auto max-w-2xl" : "max-w-xl"}`}>{desc}</p>}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-8 items-center rounded-lg bg-accent-soft px-3 text-sm font-semibold text-accent sm:text-base">{children}</span>;
}

function Avatar() {
  return (
    <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft">
      <svg viewBox="0 0 24 24" className="size-4">
        <path fill="var(--brand)" d="M12 2c.5 4.6 2.4 6.9 7 7.5-4.6.6-6.5 2.9-7 7.5-.5-4.6-2.4-6.9-7-7.5 4.6-.6 6.5-2.9 7-7.5Z" />
      </svg>
    </span>
  );
}

function Bot({ children, time }: { children: React.ReactNode; time?: string }) {
  return (
    <div className="flex gap-2">
      <Avatar />
      <div>
        <p className="text-xs font-semibold">magic.ai</p>
        <p className="mt-1 max-w-[16rem] rounded-2xl rounded-tl-sm bg-surface-2 px-3 py-2 text-sm leading-relaxed">{children}</p>
        {time && <p className="mt-1 text-[11px] text-muted">{time}</p>}
      </div>
    </div>
  );
}

function Me({ children, time }: { children: React.ReactNode; time?: string }) {
  return (
    <div className="flex flex-col items-end">
      <p className="max-w-[15rem] rounded-2xl rounded-tr-sm bg-brand px-3 py-2 text-sm leading-relaxed text-white">{children}</p>
      {time && <p className="mt-1 text-[11px] text-muted">{time}</p>}
    </div>
  );
}

// ───────── 콘텐츠 ─────────

const TRUST = [
  { label: "공공기관 자료", title: "근거 기반 답변", tone: "text-[#022891] dark:text-brand-strong" },
  { label: "24시간", title: "위기 신호 감지", tone: "text-danger" },
  { label: "개인정보 보호", title: "원문은 본인만 열람", tone: "text-brand" },
  { label: "만 19세 이상", title: "성인 전용 상담", tone: "text-accent" },
];

const USER_FEATURES = [
  {
    chips: ["24시간 대화", "나만의 공간"],
    title: "언제든 털어놓는 AI 상담",
    body: "퇴근길, 잠 못 드는 새벽에도 바로 이야기를 시작할 수 있어요. 감정을 먼저 알아주고, 생각을 차근차근 정리하도록 도와요.",
    mock: (
      <div className="mx-auto w-full max-w-sm space-y-3 rounded-3xl bg-surface p-5 shadow-[0_10px_40px_-12px_rgba(16,24,40,0.18)]">
        <Me time="오후 11:42">요즘 아무것도 하기가 싫어요</Me>
        <Bot time="오후 11:42">그런 날이 이어지면 스스로를 탓하게 되기도 하죠. 언제부터 그렇게 느꼈는지 조금 더 들려줄래요?</Bot>
      </div>
    ),
  },
  {
    chips: ["근거 기반", "출처 표시"],
    title: "공공기관 자료로 답하는 상담",
    body: "국가정신건강정보포털 등 검증된 자료를 찾아 답하고, 참고한 자료를 답변 아래에 함께 보여 드려요.",
    mock: (
      <div className="mx-auto w-full max-w-sm rounded-3xl bg-surface p-5 shadow-[0_10px_40px_-12px_rgba(16,24,40,0.18)]">
        <p className="text-sm font-semibold">참고한 자료</p>
        <ul className="mt-3 space-y-2 text-sm">
          {["우울감과 무기력, 어떻게 다를까요", "행동 활성화: 작은 일부터 다시 시작하기", "잠들기 전 걱정을 줄이는 방법"].map((t) => (
            <li key={t} className="flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5">
              <span className="size-1.5 rounded-full bg-brand" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    chips: ["기분 기록", "자가진단"],
    title: "마음의 변화를 한눈에 보는 기록",
    body: "매일의 기분 점수와 PHQ-9·GAD-7 자가진단 결과가 그래프로 쌓여요. 상담이 끝나면 AI가 대화를 요약해 둡니다.",
    mock: (
      <div className="mx-auto w-full max-w-sm rounded-3xl bg-surface p-5 shadow-[0_10px_40px_-12px_rgba(16,24,40,0.18)]">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted">이번 주 평균 기분</p>
            <p className="mt-1 text-3xl font-bold">6.2<span className="text-base font-medium text-muted"> / 10</span></p>
          </div>
          <span className="rounded-lg bg-brand-soft px-2 py-1 text-xs font-semibold text-brand">지난주보다 +1.4</span>
        </div>
        <svg viewBox="0 0 280 90" className="mt-4 w-full" aria-label="기분 점수 추이 예시">
          {[20, 50, 80].map((y) => (
            <line key={y} x1="0" x2="280" y1={y} y2={y} stroke="var(--line)" />
          ))}
          <polyline fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points="6,62 50,56 94,70 138,48 182,52 226,34 272,26" />
          <circle cx="272" cy="26" r="5" fill="var(--brand)" stroke="var(--surface)" strokeWidth="2" />
        </svg>
      </div>
    ),
  },
];

const ADMIN_FEATURES = [
  {
    chips: ["AI 위험군 선별", "실시간 알림"],
    title: "위기 신호를 놓치지 않는 알림",
    body: "자해·자살 위험이 감지된 상담은 즉시 알림 목록에 올라와요. 확인, 조치 메모, 처리 완료까지 한 화면에서 관리하세요.",
  },
  {
    chips: ["요약 중심", "열람 기록"],
    title: "개인정보를 지키는 사례 확인",
    body: "상담사는 기본적으로 AI 요약과 위험도만 봅니다. 대화 원문은 위기 상황이거나 사용자가 동의한 경우에만 열리고, 열람 이력이 남아요.",
  },
  {
    chips: ["운영 리포트", "지식베이스"],
    title: "리포트와 지식베이스 관리",
    body: "주제별 상담 빈도와 이용 추이를 확인하고, 챗봇이 참고하는 문서를 검색해 보며 답변 품질을 관리할 수 있어요.",
  },
];

const USES = [
  { title: "개인", body: "누구에게도 말하기 어려운 고민을 편하게 꺼내고, 내 마음의 변화를 스스로 살펴보세요.", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" },
  { title: "기업 임직원 지원", body: "구성원의 번아웃과 스트레스를 조기에 살피고, 필요할 때 전문 상담으로 연결하세요.", icon: "M4 20V8l8-4 8 4v12M9 20v-5h6v5M8 11h.01M12 11h.01M16 11h.01" },
  { title: "상담센터·복지기관", body: "초기 상담과 사후 관리를 AI가 돕고, 상담사는 위기 사례에 집중할 수 있어요.", icon: "M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" },
];

const FAQ = [
  { q: "AI 상담이 전문 상담을 대신할 수 있나요?", a: "아니요. magic.ai는 마음을 정리하고 필요한 도움을 찾도록 돕는 도구입니다. 진단이나 치료가 필요하면 정신건강의학과나 상담센터 이용을 권해 드려요." },
  { q: "제 상담 내용은 누가 볼 수 있나요?", a: "대화 원문은 본인만 볼 수 있어요. 상담사에게는 AI 요약과 위험도만 보이며, 원문은 위기 상황이거나 마이페이지에서 동의한 경우에만 열람됩니다." },
  { q: "위험한 상황이면 어떻게 되나요?", a: "자해·자살 위험 신호가 감지되면 AI 답변보다 자살예방상담전화 109, 정신건강위기상담 1577-0199 안내가 먼저 표시되고, 상담사에게 알림이 전달돼요." },
  { q: "기록을 지우고 싶어요.", a: "과거 기록 페이지에서 상담별로 삭제하거나, 마이페이지에서 모든 데이터를 삭제하고 탈퇴할 수 있어요." },
];

export default function Home() {
  const docCount = countKnowledgeDocs();

  return (
    <div className="bg-page">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-page/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:h-20 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-[15px] font-medium sm:gap-2">
            <a href="#flow" className="hidden px-3 py-2 hover:text-brand md:inline">서비스 흐름</a>
            <a href="#features" className="hidden px-3 py-2 hover:text-brand md:inline">주요 기능</a>
            <a href="#faq" className="hidden px-3 py-2 hover:text-brand md:inline">자주 묻는 질문</a>
            <Link href="/login" className="px-3 py-2 hover:text-brand">로그인</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* 히어로 */}
        <section className="overflow-hidden pt-14 pb-0 sm:pt-24">
          <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6">
            <h1 className="text-[34px] leading-[1.3] font-bold tracking-tight sm:text-5xl sm:leading-[1.3]">
              지친 마음을 위한 AI 상담 파트너
              <br />
              마음을 털어놓는 곳, magic.ai
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              직장, 관계, 잠 못 드는 밤까지 다양한 고민을 함께 나누고,
              <br className="hidden sm:block" />
              스스로 마음을 돌볼 수 있도록 돕는 AI 상담을 만나 보세요.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/admin" className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-dark px-7 font-bold text-page hover:opacity-90 sm:w-auto">
                <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
                상담사·관리자
              </Link>
              <Link href="/dashboard" className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand px-7 font-bold text-white hover:bg-brand-strong sm:w-auto">
                <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18l-1 3 4-2h9a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9" /></svg>
                상담 시작하기
              </Link>
            </div>
          </div>

          {/* 제품 미리보기: 대시보드 카드 + 떠 있는 채팅창 */}
          <div className="relative mx-auto mt-16 max-w-[1200px] px-4 sm:mt-20 sm:px-6">
            <div className="rounded-t-[28px] border-2 border-b-0 border-line bg-section p-4 sm:p-8">
              <p className="text-lg font-bold">나의 마음 대시보드</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:w-[68%]">
                <div className="rounded-[20px] border-2 border-line bg-surface p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand">
                      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 18l-1 3 4-2h9a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9" /></svg>
                    </span>
                    <p className="font-semibold">이번 달 상담</p>
                  </div>
                  <p className="mt-4 text-4xl font-bold text-brand">12<span className="text-lg text-muted">회</span></p>
                  <p className="mt-3 text-sm text-muted">
                    자주 나온 주제 <span className="text-brand">직장</span> · <span className="text-brand">수면</span> · <span className="text-brand">불안</span>
                  </p>
                </div>
                <div className="rounded-[20px] border-2 border-line bg-surface p-5">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-xl bg-accent-soft text-accent">
                      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20V4M4 20h16M8 15l4-5 3 3 5-6" /></svg>
                    </span>
                    <p className="font-semibold">상담 후 기분 변화</p>
                  </div>
                  <p className="mt-4 text-4xl font-bold text-accent">+2.3<span className="text-lg text-muted">점</span></p>
                  <p className="mt-3 text-sm text-muted">상담을 마칠 때 평균적으로 기분이 좋아졌어요</p>
                </div>
              </div>
              <div className="mt-4 hidden h-28 rounded-[20px] border-2 border-line bg-surface lg:block lg:w-[68%]" />
            </div>

            <div className="float-y absolute top-6 right-10 hidden w-80 rounded-3xl border border-line bg-surface p-4 shadow-[0_20px_60px_-15px_rgba(16,24,40,0.25)] lg:block">
              <div className="space-y-3">
                <Bot time="오후 10:21">오늘 하루 어땠어요? 마음에 남은 일이 있다면 들려주세요.</Bot>
                <Me time="오후 10:22">회의에서 실수한 게 계속 생각나요</Me>
                <Bot>그 장면이 자꾸 떠오르면 많이 지치죠. 😢 그때 어떤 생각이 가장 먼저 들었나요?</Bot>
              </div>
            </div>
          </div>
        </section>

        {/* 신뢰 근거 */}
        <section className="border-t-2 border-line py-14 sm:py-20">
          <h3 className="sr-only">magic.ai 신뢰 근거</h3>
          <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-3 px-4 sm:px-6 lg:grid-cols-4 lg:gap-5">
            {TRUST.map((t) => (
              <li key={t.title} className="rounded-lg border border-line bg-section px-5 py-6 text-center">
                <em className={`text-xs font-bold not-italic sm:text-sm ${t.tone}`}>{t.label}</em>
                <p className="mt-2 text-base font-bold sm:text-lg">{t.title}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 지식 현황 (보라 풀블리드) */}
        <section className="bg-brand px-4 py-20 text-white sm:py-24">
          <div className="mx-auto max-w-[1200px] text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">magic.ai가 기대고 있는 것들</h2>
            <p className="mt-4 text-white/80 sm:text-lg">모든 답변은 검수된 지식과 안전 장치 위에서 만들어집니다.</p>
            <dl className="mx-auto mt-14 grid max-w-4xl gap-10 sm:grid-cols-3">
              {[
                ["검수된 지식 문서", String(docCount), "건 +"],
                ["다루는 상담 주제", "8", "개 분야"],
                ["위기 상담 연결", "24", "시간"],
              ].map(([label, num, unit]) => (
                <div key={label}>
                  <dt className="text-white/80">{label}</dt>
                  <dd className="mt-3 text-6xl font-extrabold tracking-tight">
                    {num}
                    <span className="ml-1 text-2xl font-bold">{unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Overview */}
        <section className="bg-section px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead
              eyebrow="Overview"
              title={
                <>
                  어른에게도 마음 놓고
                  <br />
                  이야기할 수 있는 곳이 필요합니다
                </>
              }
              desc="성인 네 명 중 한 명은 살면서 정신건강 문제를 겪지만, 바쁘거나 비용이 부담되거나 말을 꺼내기 어려워 도움을 받지 못하는 경우가 많아요. magic.ai는 그 첫걸음을 가볍게 만듭니다."
            />
            <div className="mt-14 grid gap-4 sm:grid-cols-3">
              {[
                ["직장·번아웃", "성과 압박, 대인관계, 반복되는 야근으로 지친 마음"],
                ["불안·수면", "이유 없는 긴장감, 잠 못 드는 밤, 멈추지 않는 걱정"],
                ["관계·자존감", "가족, 연인, 친구와의 갈등과 나를 향한 비난"],
              ].map(([t, d]) => (
                <div key={t} className="rounded-[20px] bg-surface p-7">
                  <p className="text-xl font-bold">{t}</p>
                  <p className="mt-2 leading-relaxed text-muted">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Flow */}
        <section id="flow" className="scroll-mt-20 px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead
              eyebrow="Service Flow"
              title={
                <>
                  작은 고민부터 위기 신호까지,
                  <br />
                  magic.ai가 먼저 살펴요
                </>
              }
              desc="AI가 대화와 자가진단 결과를 분석해 마음의 변화를 기록하고, 위험 신호가 보이면 상담사가 신속하게 대응할 수 있도록 도와요."
            />
            <div className="mt-16 grid items-center gap-4 lg:grid-cols-[1fr_auto_1.25fr_auto_1fr]">
              <FlowCard title="사용자" items={["AI 상담 대화", "기분 기록·자가진단"]} />
              <FlowArrow />
              <div className="rounded-[20px] bg-brand p-6 text-white">
                <p className="flex items-center justify-center gap-2 text-xl font-bold">magic.ai</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                  {["위기 신호 감지", "근거 자료 검색 후 답변", "상담 요약·주제 분류", "마음 변화 리포트"].map((t) => (
                    <li key={t} className="rounded-xl bg-white/15 px-3 py-3 text-center font-semibold">{t}</li>
                  ))}
                </ul>
              </div>
              <FlowArrow />
              <FlowCard title="상담사·관리자" items={["위기 알림 확인·조치", "이용 현황 리포트"]} />
            </div>
          </div>
        </section>

        {/* For Users */}
        <section id="features" className="scroll-mt-20 px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead
              eyebrow="For Users"
              title={
                <>
                  늘 곁에 있는 AI 상담 파트너와
                  <br />
                  나만의 공간에서 속마음을 나눠 보세요
                </>
              }
            />
            <div className="mt-16 space-y-8 sm:mt-24 sm:space-y-24">
              {USER_FEATURES.map((f, i) => (
                <article key={f.title} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                  <div className={i % 2 ? "lg:order-2" : ""}>
                    <div className="flex flex-wrap gap-2">
                      {f.chips.map((c) => <Chip key={c}>{c}</Chip>)}
                    </div>
                    <h3 className="mt-5 text-2xl leading-snug font-bold sm:text-4xl">{f.title}</h3>
                    <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{f.body}</p>
                  </div>
                  <div className="rounded-[28px] bg-section px-5 py-10 sm:px-10 sm:py-14">{f.mock}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* For Counselors */}
        <section className="bg-section px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead
              eyebrow="For Counselors"
              title={
                <>
                  AI 기반 관리자 대시보드로
                  <br />
                  놓치기 쉬운 마음의 변화까지 확인하세요
                </>
              }
            />
            <div className="mt-16 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
              <ul className="space-y-10">
                {ADMIN_FEATURES.map((f) => (
                  <li key={f.title}>
                    <div className="flex flex-wrap gap-2">
                      {f.chips.map((c) => <Chip key={c}>{c}</Chip>)}
                    </div>
                    <h3 className="mt-4 text-2xl font-bold sm:text-[28px]">{f.title}</h3>
                    <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
                  </li>
                ))}
              </ul>
              <div className="self-start rounded-[20px] border-2 border-line bg-surface p-6">
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold">위기 알림</p>
                  <span className="rounded-full bg-danger-soft px-3 py-1 text-xs font-bold text-danger">새 알림 1</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {[
                    ["새벽별", "다 그만두고 싶다는 생각이 들어요", "새 알림"],
                    ["moss", "요즘 사라지고 싶어요", "확인함"],
                    ["지나가는 사람", "밤마다 숨이 막혀요", "처리 완료"],
                  ].map(([name, title, status]) => (
                    <li key={name} className="flex items-center justify-between gap-3 rounded-xl bg-section px-4 py-3.5">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{title}</span>
                        <span className="text-sm text-muted">{name}</span>
                      </span>
                      <span className={`shrink-0 text-sm font-semibold ${status === "새 알림" ? "text-danger" : "text-muted"}`}>{status}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-2xl bg-section p-5 text-center">
                  <p className="text-lg font-bold">관리자 대시보드 구경하기</p>
                  <p className="mt-1 text-sm text-muted">데모 데이터로 모든 기능을 둘러볼 수 있어요.</p>
                  <Link href="/admin" className="mt-4 inline-block rounded-md bg-dark px-5 py-3 font-bold text-page hover:opacity-90">
                    서비스 둘러보기
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead eyebrow="Use Cases" title="어디에서 활용하나요?" />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {USES.map((u) => (
                <div key={u.title} className="rounded-xl border-2 border-line bg-surface p-8">
                  <span className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
                    <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={u.icon} /></svg>
                  </span>
                  <em className="mt-6 block text-2xl font-bold not-italic">{u.title}</em>
                  <p className="mt-3 leading-relaxed text-muted">{u.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 bg-section px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <SectionHead eyebrow="FAQ" title="자주 묻는 질문" />
            <div className="mt-12 space-y-3">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-2xl bg-surface px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                    {f.q}
                    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-20 sm:py-24">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 rounded-[28px] bg-brand-soft px-8 py-12 text-center md:flex-row md:text-left">
            <p className="text-2xl leading-snug font-bold sm:text-3xl">
              오늘 있었던 일,
              <br />
              한 줄부터 시작해도 괜찮아요
            </p>
            <Link href="/dashboard" className="rounded-md bg-dark px-7 py-4 text-lg font-bold text-page hover:opacity-90">
              상담 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-bg px-4 py-14">
        <div className="mx-auto grid max-w-[1200px] gap-10 text-sm md:grid-cols-[1fr_auto]">
          <div>
            <Logo />
            <p className="mt-5 max-w-lg leading-relaxed text-muted">
              magic.ai는 전문 상담이나 의료 서비스를 대체하지 않습니다. 진단과 치료가 필요하면 정신건강의학과 또는 상담센터를 이용해 주세요.
            </p>
            <div className="mt-6 flex gap-5 font-bold">
              <Link href="/login">로그인</Link>
              <a href="#faq">자주 묻는 질문</a>
              <span>개인정보처리방침</span>
              <span>이용약관</span>
            </div>
            <p className="mt-6 text-muted">© 2026 magic.ai All Rights Reserved</p>
          </div>
          <div className="rounded-2xl bg-danger-soft p-5">
            <p className="font-bold text-danger">위기 상황이라면 지금 바로</p>
            <p className="mt-3">자살예방상담전화 <a href="tel:109" className="font-bold">109</a></p>
            <p className="mt-1">정신건강위기상담 <a href="tel:15770199" className="font-bold">1577-0199</a></p>
            <p className="mt-1">응급 <a href="tel:119" className="font-bold">119</a></p>
          </div>
        </div>
      </footer>

      {/* 떠 있는 상담 버튼 */}
      <Link
        href="/dashboard/counsel"
        className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-4 font-semibold text-white shadow-[0_0_4px_rgba(0,0,0,0.2)] hover:bg-brand-strong sm:right-8 sm:bottom-8"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18l-1 3 4-2h9a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9" /></svg>
        지금 상담하기
      </Link>
    </div>
  );
}

function FlowCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[20px] border-2 border-line bg-surface p-6">
      <p className="text-center text-xl font-bold">{title}</p>
      <ul className="mt-5 space-y-2">
        {items.map((t) => (
          <li key={t} className="rounded-xl bg-section px-3 py-3 text-center font-semibold">{t}</li>
        ))}
      </ul>
    </div>
  );
}

function FlowArrow() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="mx-auto size-7 rotate-90 text-brand lg:rotate-0" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
