import Link from "next/link";
import bundle from "@/generated/knowledge.json";
import { Logo } from "@/components/Logo";
import { Mascot, StarMark, type MascotPose } from "@/components/Mascot";
import { COMPANY } from "@/lib/company";
import { MobileMenu } from "./MobileMenu";

// 랜딩 페이지 — Claude Design 시안(magic.ai 랜딩 페이지)을 옮김.
// 시안과 다르게 바꾼 문구: 실제 서비스에 없는 "상담사 연결"은 빼고, 대화 열람 범위와 문서 검수 상태를 사실대로 적었다.

const docCount = bundle.docs.length;
const topicCount = new Set(bundle.docs.map((d) => d.category)).size;

// ───────── 아이콘 (24×24 선 아이콘) ─────────

const ICONS = {
  book: "M3 5.5C5.5 4.5 8.5 4.5 12 6.5c3.5-2 6.5-2 9-1V19c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1z M12 6.5V20",
  shield: "M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z M8.5 12h2l1.2-2.5 1.6 5 1.2-2.5h1.5",
  lock: "M7.5 10.5h9a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 5 18v-5a2.5 2.5 0 0 1 2.5-2.5z M8 10.5V8a4 4 0 0 1 8 0v2.5",
  adult: "M9 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6 M15.5 11l2 2 4-4",
  chat: "M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12z",
  search: "M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z M20 20l-4-4",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  bell: "M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z M10 20a2 2 0 0 0 4 0",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  chart: "M5 20V11M12 20V5M19 20v-6",
  doc: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h4",
  db: "M4 5.5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  arrow: "M5 12h14M13 6l6 6-6 6",
  check: "M5 12.5l4.5 4.5L19 7.5",
  send: "M4 12l16-8-6 16-2.5-6.5z",
  chevron: "M6 9l6 6 6-6",
} as const;

function Icon({ name, className = "size-6", strokeWidth = 1.8 }: { name: keyof typeof ICONS; className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );
}

function Sparkle({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`absolute ${className}`}>
      <path fill="currentColor" d="M12 1.5Q13.2 10.8 22.5 12Q13.2 13.2 12 22.5Q10.8 13.2 1.5 12Q10.8 10.8 12 1.5Z" />
    </svg>
  );
}

// ───────── 공통 조각 ─────────

const container = "mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-10";
const sectionY = "py-[72px] lg:py-[120px]";
const h2 = "text-[28px] leading-[1.3] font-extrabold tracking-[-0.02em] sm:text-4xl lg:text-[44px]";

function Eyebrow({ children, tone = "soft" }: { children: React.ReactNode; tone?: "soft" | "brand" | "dark" }) {
  const tones = {
    soft: "bg-brand-soft text-brand-deep",
    brand: "bg-brand-ink text-white",
    dark: "bg-ink-2 text-white",
  };
  return <span className={`inline-block rounded-full px-3.5 py-1.5 text-[15px] font-bold ${tones[tone]}`}>{children}</span>;
}

function CenterHead({ eyebrow, tone, title, desc }: { eyebrow: string; tone?: "soft" | "brand" | "dark"; title: React.ReactNode; desc?: string }) {
  return (
    <div className="mb-10 flex flex-col items-center gap-4 text-center lg:mb-14">
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
      <h2 className={h2}>{title}</h2>
      {desc && <p className="max-w-[560px] text-[17px] leading-[1.7] text-muted">{desc}</p>}
    </div>
  );
}

function PrimaryButton({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand-ink px-7 text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(107,85,247,0.28)] transition hover:bg-brand-deep ${className}`}
    >
      {children}
      <Icon name="arrow" className="size-5" strokeWidth={2} />
    </Link>
  );
}

// ───────── 데이터 ─────────

const TRUST: { icon: keyof typeof ICONS; title: string; desc: string }[] = [
  { icon: "book", title: "공공기관 자료 근거", desc: "국가정신건강정보포털 등 공공기관 자료를 정리해 답해요" },
  { icon: "shield", title: "위기 신호 우선 안내", desc: "위험 신호가 보이면 상담 번호부터 안내해요" },
  { icon: "lock", title: "대화 내용 보호", desc: "관리자는 위기 상황이거나 동의한 경우에만 대화를 확인해요" },
  { icon: "adult", title: "만 19세 이상 성인 전용", desc: "성인을 위한 상담 공간으로 운영돼요" },
];

const WORRIES: { pose: MascotPose; tag: string; title: string; desc: string; quotes: string[] }[] = [
  {
    pose: "mug",
    tag: "직장 · 번아웃",
    title: "쉬어도 쉰 것 같지 않을 때",
    desc: "일과 나 사이에 숨 쉴 틈을 함께 찾아봐요. 오늘 버틴 것만으로도 충분해요.",
    quotes: ["출근 생각만 해도 숨이 막혀요", "이게 번아웃인지 궁금해요"],
  },
  {
    pose: "moon",
    tag: "불안 · 수면",
    title: "생각이 꼬리를 무는 밤",
    desc: "불안을 가라앉히고 잠드는 데 도움이 되는 방법을 차근차근 같이 연습해요.",
    quotes: ["밤만 되면 걱정이 많아져요", "새벽에 자꾸 깨요"],
  },
  {
    pose: "heart",
    tag: "관계 · 자존감",
    title: "사람 때문에 지칠 때",
    desc: "서운함과 자책을 천천히 풀어 보고, 나를 아끼는 말부터 다시 시작해요.",
    quotes: ["친구에게 서운한 마음이 커요", "자꾸 나를 탓하게 돼요"],
  },
];

const FAQ = [
  {
    q: "magic.ai가 전문 상담을 대신하나요?",
    a: "아니요. magic.ai는 마음을 정리하고 필요한 정보를 찾도록 돕는 AI 상담 파트너예요. 진단이나 치료를 하지 않으며, 전문적인 도움이 필요해 보이면 상담 기관과 연락처를 안내해 드려요.",
  },
  {
    q: "제 대화 내용은 누가 볼 수 있나요?",
    a: "대화 원문은 기본적으로 본인만 볼 수 있어요. 다만 위기 신호가 감지된 대화이거나, 마이페이지에서 관리자 열람에 동의한 경우에는 안전을 위해 관리자가 확인할 수 있어요. 동의는 언제든 마이페이지에서 바꿀 수 있어요.",
  },
  {
    q: "위기 상황이면 어떻게 되나요?",
    a: "대화 중 위기 신호가 보이면 자살예방 상담전화 109와 정신건강 위기상담전화 1577-0199를 가장 먼저 안내해요. 지금 당장 위험하다면 바로 119에 연락해 주세요.",
  },
  {
    q: "AI의 답변은 무엇을 근거로 하나요?",
    a: "국가정신건강정보포털 등 공공기관 정신건강 자료를 지식 문서로 정리해 두고, 질문과 관련된 내용을 찾아 답해요. 답변에 참고한 자료는 출처로 함께 보여 드려요.",
  },
];

const NAV = [
  { href: "#about", label: "서비스 소개" },
  { href: "#features", label: "주요 기능" },
  { href: "#faq", label: "자주 묻는 질문" },
];

const CRISIS = [
  { tel: "109", num: "109", label: "자살예방 상담전화" },
  { tel: "15770199", num: "1577-0199", label: "정신건강 위기상담전화" },
  { tel: "119", num: "119", label: "긴급 상황 · 응급 구조" },
];

// ───────── 페이지 ─────────

export default function Home() {
  return (
    <div data-theme="light" className="flex-1 overflow-x-clip bg-page text-ink">
      <Header />
      <Hero />
      <Trust />
      <About />
      <Worries />
      <Flow />
      <Features />
      <AdminFeatures />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#f2f4f7] bg-page/95 backdrop-blur">
      <div className={`${container} flex h-[72px] items-center justify-between gap-6`}>
        <Logo />
        <div className="hidden items-center gap-12 md:flex">
          <nav aria-label="주요 메뉴" className="flex items-center gap-9 text-base font-semibold text-ink-2">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-brand-ink">{n.label}</a>
            ))}
          </nav>
          <Link href="/login" className="inline-flex h-11 items-center rounded-full border border-[#d0d5dd] px-[22px] text-[15px] font-bold hover:border-brand-ink">
            로그인
          </Link>
        </div>
        {/* 모바일: 로그인 + 메뉴 */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/login" className="inline-flex h-11 items-center rounded-full border border-[#d0d5dd] px-4 text-[15px] font-bold">
            로그인
          </Link>
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="pt-10 pb-[72px] sm:pt-16 lg:pt-[88px] lg:pb-28">
      <div className={`${container} flex flex-wrap items-center gap-12 lg:gap-[72px]`}>
        <div className="min-w-0 flex-[1_1_460px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-soft bg-brand-tint px-3.5 py-2 text-[15px] font-semibold text-brand-deep">
            <span className="size-2 rounded-full bg-accent" />
            괜찮은 척하지 않아도 되는 곳
          </div>
          <h1 className="mt-6 text-[38px] leading-[1.22] font-extrabold tracking-[-0.03em] sm:text-5xl lg:text-[64px]">
            지친 마음을 위한
            <br />
            <span className="text-brand-ink">AI 상담 파트너</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-[17px] leading-[1.7] text-muted lg:text-xl">
            직장, 관계, 불면, 불안으로 지친 하루를 편하게 털어놓으세요. 공공기관 정신건강 자료를 바탕으로, 판단하지 않고 곁에서 들어 드릴게요.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <PrimaryButton href="/dashboard/counsel">상담 시작하기</PrimaryButton>
            <Link href="/admin" className="inline-flex h-14 items-center justify-center rounded-full bg-ink-2 px-7 text-[17px] font-bold text-white hover:opacity-90">
              관리자
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[15px] text-muted">
            {["만 19세 이상 성인 전용", "위기 시 109 우선 안내"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Icon name="check" className="size-[18px] text-brand-ink" strokeWidth={2.2} />
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 flex-[1_1_460px]">
          <div className="relative rounded-[36px] bg-brand-soft px-4 pt-[104px] pb-10 sm:px-9 sm:pb-12">
            <div className="absolute -top-9 left-1 size-32 sm:size-[150px]">
              <Mascot pose="wave" size="100%" />
            </div>
            <p className="absolute top-[34px] right-4 left-[132px] sm:left-[148px]">
              <span className="inline-block rounded-[18px_18px_18px_6px] bg-white px-4 py-2.5 text-[15px] font-semibold text-ink-2 shadow-[0_6px_16px_rgba(119,97,255,0.12)]">
                오늘 하루, 어땠어요?
              </span>
            </p>
            <Sparkle className="top-7 right-8 size-[22px] text-white" />
            <Sparkle className="top-[62px] right-16 size-3 text-accent" />

            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_rgba(119,97,255,0.14)]">
              <div className="flex items-center gap-3 border-b border-[#f2f4f7] px-5 py-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft">
                  <StarMark className="size-[26px]" eyes={false} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold">magic.ai</p>
                  <p className="text-[13px] text-muted">지금 이야기 들을 수 있어요</p>
                </div>
                <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1 text-xs font-semibold text-muted">예시 화면</span>
              </div>
              <div className="flex flex-col gap-3 bg-[#fcfcff] p-5 text-[15px] leading-[1.6]">
                <p className="self-center text-xs text-[#98a2b3]">오늘 밤 11:42</p>
                <p className="max-w-[82%] self-end rounded-[20px_20px_6px_20px] bg-brand-ink px-4 py-3 text-white">
                  요즘 회사 일 때문에 잠을 못 자요. 누워도 계속 생각이 나요.
                </p>
                <p className="max-w-[88%] self-start rounded-[20px_20px_20px_6px] bg-[#f2f0ff] px-4 py-3">
                  많이 지치셨겠어요. 몸은 누워 있어도 머릿속이 계속 일을 붙잡고 있으면 쉬기 어렵죠. 오늘 가장 마음에 걸렸던 일을 한 줄만 적어 볼까요?
                </p>
                <p className="inline-flex items-center gap-1.5 self-start rounded-full border border-brand-soft bg-white px-3 py-1.5 text-[13px] font-semibold text-brand-deep">
                  <Icon name="book" className="size-4" />
                  참고 · 국가정신건강정보포털 수면 건강 자료
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-sm text-brand-deep" aria-hidden>
                  <span className="rounded-full border border-brand-line bg-white px-3.5 py-2">회의에서 실수했어요</span>
                  <span className="rounded-full border border-brand-line bg-white px-3.5 py-2">그냥 들어 줬으면 해요</span>
                </div>
              </div>
              <Link href="/dashboard/counsel" className="flex items-center gap-2.5 border-t border-[#f2f4f7] px-4 py-3.5" aria-label="상담 화면으로 이동">
                <span className="flex h-11 min-w-0 flex-1 items-center rounded-full border border-line bg-[#f9fafb] px-[18px] text-[15px] text-[#98a2b3]">
                  마음 편히 적어 주세요…
                </span>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-ink text-white">
                  <Icon name="send" className="size-5" strokeWidth={2} />
                </span>
              </Link>
            </div>
          </div>
          <div className="absolute right-4 -bottom-7 flex max-w-[280px] items-center gap-2.5 rounded-2xl bg-white px-4 py-3 shadow-[0_12px_28px_rgba(16,24,40,0.10)]">
            <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-accent-tint text-[#e06c00]">
              <Icon name="shield" className="size-5" />
            </span>
            <p className="text-sm leading-normal text-ink-2">
              위기 신호가 보이면 <b className="text-ink">109 · 1577-0199</b>를 먼저 안내해요
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  return (
    <section aria-label="magic.ai 안전 원칙" className="pb-[72px] lg:pb-[120px]">
      <div className={`${container} grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]`}>
        {TRUST.map((t) => (
          <div key={t.title} className="flex items-start gap-3.5 rounded-[20px] border border-line bg-white p-[22px]">
            <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-brand-tint text-brand-ink">
              <Icon name={t.icon} />
            </span>
            <div>
              <p className="text-[17px] font-bold">{t.title}</p>
              <p className="mt-1 text-[15px] leading-[1.55] text-muted">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() {
  const stats = [
    { num: `${docCount}`, unit: "건", title: "정신건강 지식 문서", desc: "공공기관 자료를 주제별로 정리" },
    { num: `${topicCount}`, unit: "개 분야", title: "상담 주제", desc: "직장·관계·수면·불안 등" },
    { num: "24", unit: "시간", title: "위기 상담 번호 안내", desc: "109 · 1577-0199" },
  ];
  return (
    <section id="about" className={`scroll-mt-[72px] bg-brand-tint ${sectionY}`}>
      <div className={`${container} flex flex-wrap items-center gap-12`}>
        <div className="flex min-w-0 flex-[1_1_360px] flex-col items-start gap-4">
          <Eyebrow>숫자로 보는 magic.ai</Eyebrow>
          <h2 className={h2}>
            믿을 수 있는 자료로,
            <br />
            언제든 곁에 있어요
          </h2>
          <p className="text-[17px] leading-[1.7] text-muted-2">답변은 공공기관 정신건강 자료를 정리한 지식 문서를 바탕으로 해요.</p>
          <Mascot pose="book" size={180} className="mt-2" />
        </div>
        <div className="grid min-w-0 flex-[1.6_1_520px] gap-4 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
          {stats.map((s) => (
            <div key={s.title} className="rounded-3xl bg-white px-7 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_rgba(119,97,255,0.08)]">
              <p className="text-[44px] leading-none font-extrabold tracking-[-0.03em] lg:text-[56px]">
                {s.num}
                <span className="ml-1 text-[0.5em] text-brand-ink">{s.unit}</span>
              </p>
              <p className="mt-4 text-[17px] font-semibold text-ink-2">{s.title}</p>
              <p className="mt-1 text-[15px] text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Worries() {
  return (
    <section className={sectionY}>
      <div className={container}>
        <CenterHead
          eyebrow="이런 고민을 함께해요"
          title={
            <>
              혼자 버티던 마음,
              <br />
              여기서는 내려놓아도 돼요
            </>
          }
        />
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
          {WORRIES.map((w) => (
            <article key={w.tag} className="flex flex-col overflow-hidden rounded-[28px] border border-line bg-white">
              <div className="grid h-[220px] place-items-center bg-brand-tint">
                <Mascot pose={w.pose} size={200} />
              </div>
              <div className="flex flex-col gap-3 p-7">
                <p className="text-sm font-bold text-brand-deep">{w.tag}</p>
                <h3 className="text-[22px] leading-[1.4] font-extrabold">{w.title}</h3>
                <p className="text-base leading-[1.7] text-muted">{w.desc}</p>
                <div className="mt-1 flex flex-col gap-2">
                  {w.quotes.map((q) => (
                    <span key={q} className="rounded-xl bg-[#f9fafb] px-3.5 py-2.5 text-[15px] text-ink-2">
                      “{q}”
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FlowArrow() {
  return (
    <div aria-hidden className="flex basis-full items-center justify-center py-1 text-[#b3a6ff] lg:basis-auto">
      <Icon name="arrow" className="size-8 rotate-90 lg:rotate-0" strokeWidth={2.4} />
    </div>
  );
}

function Flow() {
  return (
    <section className="pb-[72px] lg:pb-[120px]">
      <div className={container}>
        <CenterHead
          eyebrow="서비스 흐름"
          title={
            <>
              한 줄의 대화부터 위기 안내까지,
              <br />
              이렇게 이어져요
            </>
          }
        />
        <div className="flex flex-wrap items-stretch justify-center gap-3">
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5 rounded-[28px] bg-brand-tint p-8">
            <p className="text-sm font-extrabold tracking-[0.04em] text-brand-deep">STEP 1</p>
            <span className="grid size-14 place-items-center rounded-[18px] bg-white text-brand-ink">
              <Icon name="chat" className="size-7" />
            </span>
            <h3 className="text-[22px] font-extrabold">마음 털어놓기</h3>
            <p className="text-base leading-[1.7] text-muted-2">지금 느끼는 마음을 편한 말로 이야기해요. 짧은 한 줄도 괜찮아요.</p>
          </div>
          <FlowArrow />
          <div className="flex min-w-0 flex-[1.3_1_320px] flex-col gap-3.5 rounded-[28px] bg-brand-ink px-8 pt-7 pb-8 text-white shadow-[0_16px_40px_rgba(107,85,247,0.28)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold tracking-[0.04em]">STEP 2</p>
                <h3 className="mt-2 text-2xl font-extrabold">magic.ai</h3>
              </div>
              <span className="rounded-3xl bg-white">
                <Mascot pose="bubble" size={96} decorative />
              </span>
            </div>
            <ul className="flex flex-col gap-2 text-base font-semibold">
              {(
                [
                  ["shield", "위기 신호 확인"],
                  ["search", "근거 자료 검색"],
                  ["chat", "공감과 제안이 담긴 답변"],
                ] as const
              ).map(([icon, label]) => (
                <li key={label} className="flex items-center gap-2.5 rounded-[14px] bg-white/15 px-3.5 py-3">
                  <Icon name={icon} className="size-5" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          <FlowArrow />
          <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5 rounded-[28px] bg-brand-tint p-8">
            <p className="text-sm font-extrabold tracking-[0.04em] text-brand-deep">STEP 3</p>
            <span className="grid size-14 place-items-center rounded-[18px] bg-white text-brand-ink">
              <Icon name="list" className="size-7" />
            </span>
            <h3 className="text-[22px] font-extrabold">요약과 기록</h3>
            <p className="text-base leading-[1.7] text-muted-2">대화가 끝나면 요약과 기분 점수가 내 기록에 남아요. 지난 대화를 언제든 다시 볼 수 있어요.</p>
          </div>
        </div>
        <div className="mt-7 flex justify-center">
          <p className="inline-flex items-center gap-2.5 rounded-[28px] bg-accent-tint px-5 py-3 text-[15px] leading-normal">
            <Icon name="phone" className="size-5 text-[#e06c00]" />
            <span>
              위기 신호가 보이면 대화보다 먼저 <b>109 · 1577-0199</b>를 안내하고, 관리자에게도 알려요
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function FeaturePreview({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[260px] items-center bg-brand-tint p-6">
      <div className="flex w-full flex-col gap-2.5 rounded-[18px] bg-white p-4 shadow-[0_8px_24px_rgba(119,97,255,0.10)]">{children}</div>
    </div>
  );
}

function Features() {
  const bars = [40, 55, 35, 60, 70, 65, 85];
  return (
    <section id="features" className={`scroll-mt-[72px] border-t border-[#f2f4f7] bg-[#fcfcff] ${sectionY}`}>
      <div className={container}>
        <CenterHead
          eyebrow="사용자를 위한 기능"
          tone="brand"
          title={
            <>
              혼자 삼키던 말을,
              <br />
              편하게 꺼내 보세요
            </>
          }
          desc="언제든 이야기하고, 근거를 확인하고, 내 마음의 흐름을 기록할 수 있어요."
        />
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(310px,1fr))]">
          <article className="overflow-hidden rounded-[28px] border border-line bg-white">
            <FeaturePreview>
              <p className="max-w-[86%] self-start rounded-[16px_16px_16px_6px] bg-[#f2f0ff] px-3.5 py-2.5 text-sm leading-[1.55]">오늘 하루 중 가장 무거웠던 순간은 언제였어요?</p>
              <p className="max-w-[80%] self-end rounded-[16px_16px_6px_16px] bg-brand-ink px-3.5 py-2.5 text-sm leading-[1.55] text-white">퇴근길에 갑자기 눈물이 났어요</p>
              <p className="flex gap-[5px] self-start rounded-[16px_16px_16px_6px] bg-[#f2f0ff] px-3.5 py-3" aria-label="답변 작성 중">
                <span className="size-[7px] rounded-full bg-[#b3a6ff]" />
                <span className="size-[7px] rounded-full bg-[#9283ff]" />
                <span className="size-[7px] rounded-full bg-brand" />
              </p>
            </FeaturePreview>
            <div className="flex flex-col gap-2.5 p-7">
              <h3 className="text-[22px] font-extrabold">AI 상담</h3>
              <p className="text-base leading-[1.7] text-muted">판단하지 않고 끝까지 들어 줘요. 밤늦게도, 출근길에도 편한 시간에 이야기할 수 있어요.</p>
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-line bg-white">
            <FeaturePreview>
              <p className="rounded-[16px_16px_16px_6px] bg-[#f2f0ff] px-3.5 py-2.5 text-sm leading-[1.55]">
                잠들기 전 30분은 화면을 멀리하고, 매일 같은 시간에 일어나는 것부터 시작해 보세요.
                <sup className="font-bold text-brand-deep">1</sup>
              </p>
              <p className="text-[13px] font-bold text-muted">참고한 자료</p>
              <div className="flex items-center gap-2.5 rounded-xl border border-brand-soft px-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-brand-soft text-[13px] font-extrabold text-brand-deep">1</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">국가정신건강정보포털</p>
                  <p className="text-[13px] text-muted">수면 건강 · 생활 습관 자료</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-tint px-2 py-1 text-xs font-bold text-brand-deep">출처</span>
              </div>
            </FeaturePreview>
            <div className="flex flex-col gap-2.5 p-7">
              <h3 className="text-[22px] font-extrabold">참고 자료 출처 표시</h3>
              <p className="text-base leading-[1.7] text-muted">답변에 참고한 공공기관 자료를 함께 보여 드려요. 어디서 온 정보인지 바로 확인할 수 있어요.</p>
            </div>
          </article>

          <article className="overflow-hidden rounded-[28px] border border-line bg-white">
            <FeaturePreview>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">이번 주 기분</span>
                <span className="text-xs text-muted">예시</span>
              </div>
              <div className="grid h-[84px] grid-cols-7 items-end gap-2">
                {bars.map((h, i) => (
                  <div key={i} style={{ height: `${h}%` }} className={`rounded-md ${i === bars.length - 1 ? "bg-brand" : "bg-brand-line"}`} />
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted">
                {["월", "화", "수", "목", "금", "토", "일"].map((d, i) => (
                  <span key={d} className={i === 6 ? "font-bold text-brand-deep" : ""}>{d}</span>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-[#f2f4f7] pt-2.5 text-[13px]">
                <span className="font-semibold text-ink-2">자가진단 · 우울/불안 체크</span>
                <span className="font-bold text-brand-deep">기록 3회</span>
              </div>
            </FeaturePreview>
            <div className="flex flex-col gap-2.5 p-7">
              <h3 className="text-[22px] font-extrabold">기분·자가진단 기록</h3>
              <p className="text-base leading-[1.7] text-muted">매일의 기분과 자가진단 결과를 기록해 내 마음의 흐름을 돌아볼 수 있어요.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function AdminFeatures() {
  const nav: [keyof typeof ICONS, string, boolean?][] = [
    ["chart", "대시보드", true],
    ["bell", "위기 알림"],
    ["list", "상담 기록"],
    ["doc", "리포트"],
    ["db", "지식베이스"],
  ];
  return (
    <section id="admin" className={`bg-brand-tint ${sectionY}`}>
      <div className={container}>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 lg:mb-14">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col items-start gap-4">
            <Eyebrow tone="dark">운영자를 위한 기능</Eyebrow>
            <h2 className={h2}>
              꼭 필요한 순간을
              <br />
              놓치지 않도록
            </h2>
            <p className="max-w-[560px] text-[17px] leading-[1.7] text-muted-2">
              위기 알림과 이용 현황을 한 화면에서 확인해요. 대화 원문은 위기 상황이거나 사용자가 동의한 경우에만 열람해요.
            </p>
          </div>
          <Mascot pose="book" size={150} decorative className="hidden sm:block" />
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_24px_56px_rgba(119,97,255,0.14)]">
          <div className="flex items-center gap-2 border-b border-[#f2f4f7] px-[18px] py-3.5">
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="size-2.5 rounded-full bg-line" />
            <span className="ml-2 text-[13px] font-semibold text-muted">관리자 대시보드</span>
            <span className="ml-auto rounded-full bg-[#f2f4f7] px-2.5 py-1 text-xs font-semibold text-muted">예시 화면 · 가상 데이터</span>
          </div>
          <div className="flex">
            <ul className="hidden w-[210px] shrink-0 flex-col gap-1 border-r border-[#f2f4f7] bg-[#fcfcff] px-3.5 py-5 text-[15px] md:flex">
              {nav.map(([icon, label, active]) => (
                <li
                  key={label}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${active ? "bg-[#f2f0ff] font-bold text-brand-deep" : "font-semibold text-ink-2"}`}
                >
                  <Icon name={icon} className="size-[18px]" />
                  {label}
                  {label === "위기 알림" && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-accent text-xs font-extrabold text-ink">1</span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex min-w-0 flex-1 flex-col gap-5 p-4 sm:p-7">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="text-xl font-extrabold">오늘의 현황</span>
                <span className="text-[13px] text-muted">예시 데이터</span>
              </div>
              <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                <div className="rounded-2xl border border-line px-[18px] py-4">
                  <p className="text-[13px] text-muted">오늘 대화</p>
                  <p className="mt-1.5 text-[26px] font-extrabold">
                    42<span className="ml-1 text-sm font-semibold text-muted">건</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-[#ffd8b5] bg-[#fffaf5] px-[18px] py-4">
                  <p className="text-[13px] text-accent-ink">위기 알림</p>
                  <p className="mt-1.5 text-[26px] font-extrabold">
                    2<span className="ml-1.5 text-sm font-semibold text-accent-ink">미확인 1</span>
                  </p>
                </div>
                <div className="rounded-2xl border border-line px-[18px] py-4">
                  <p className="text-[13px] text-muted">이번 주 이용자</p>
                  <p className="mt-1.5 text-[26px] font-extrabold">
                    18<span className="ml-1 text-sm font-semibold text-muted">명</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex min-w-0 flex-[1.2_1_320px] flex-col gap-3 rounded-2xl border border-line p-[18px]">
                  <p className="text-base font-extrabold">위기 알림</p>
                  <div className="flex items-center gap-3 rounded-xl bg-[#fffaf5] p-3">
                    <span className="shrink-0 rounded-full bg-[#ffe7d1] px-2.5 py-1 text-xs font-extrabold text-accent-ink">높음</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">사용자 A · 위험 표현 감지</p>
                      <p className="text-[13px] text-muted">3분 전 · 109 안내 완료</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-ink-2 px-3 py-1.5 text-[13px] font-bold text-white">확인</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-[#f9fafb] p-3">
                    <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-extrabold text-brand-deep">주의</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">사용자 B · 수면 문제 지속</p>
                      <p className="text-[13px] text-muted">1시간 전 · 관리자 확인 완료</p>
                    </div>
                  </div>
                </div>
                <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-3 rounded-2xl border border-line p-[18px]">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-extrabold">대화 요약</span>
                    <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-bold text-brand-deep">AI 요약</span>
                  </div>
                  <p className="text-sm font-bold">사용자 C · 7회차 대화</p>
                  <dl className="flex flex-col gap-2 text-sm leading-[1.55] text-ink-2">
                    {[
                      ["주제", "직장 스트레스, 수면 문제"],
                      ["변화", "지난주보다 잠드는 시간이 빨라짐"],
                      ["기분", "시작 4점 → 마무리 6점"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="w-9 shrink-0 text-muted">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-2">
                    <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1">#번아웃</span>
                    <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1">#불면</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
          {(
            [
              ["bell", "위기 알림", "위험 표현이 감지되면 바로 알리고, 109·1577-0199 안내 여부까지 함께 보여 줘요."],
              ["list", "요약 중심 기록 확인", "긴 대화 원문 대신 핵심 요약과 기분 변화로 흐름을 빠르게 파악해요."],
              ["db", "리포트·지식베이스", "이용 현황 리포트를 보고, 답변 근거가 되는 지식 문서를 직접 검수·관리해요."],
            ] as const
          ).map(([icon, title, desc]) => (
            <div key={title} className="flex flex-col gap-2.5">
              <span className="grid size-12 place-items-center rounded-[14px] bg-white text-brand-ink">
                <Icon name={icon} />
              </span>
              <h3 className="mt-1 text-xl font-extrabold">{title}</h3>
              <p className="text-base leading-[1.7] text-muted-2">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className={`scroll-mt-[72px] ${sectionY}`}>
      <div className="mx-auto w-full max-w-[840px] px-5 sm:px-8 lg:px-10">
        <CenterHead eyebrow="FAQ" title="자주 묻는 질문" />
        <div className="flex flex-col gap-3">
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0} className="group rounded-[20px] border border-line bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-[22px] text-lg font-bold [&::-webkit-details-marker]:hidden">
                {f.q}
                <Icon name="chevron" className="size-[22px] text-muted transition group-open:rotate-180" strokeWidth={2} />
              </summary>
              <p className="px-6 pb-6 text-base leading-[1.7] text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="start" className="pb-[72px] lg:pb-[120px]">
      <div className={container}>
        <div className="relative flex flex-wrap items-center justify-center gap-6 rounded-[40px] bg-brand-soft p-10 sm:p-14 lg:gap-14 lg:p-[72px]">
          <Sparkle className="top-9 right-12 size-[26px] text-white" />
          <Sparkle className="bottom-11 left-[52px] size-3.5 text-accent" />
          <Mascot pose="heart" size={220} />
          <div className="flex min-w-0 max-w-[600px] flex-[1_1_360px] flex-col items-start gap-4">
            <h2 className={h2}>
              오늘 있었던 일,
              <br />
              한 줄부터 시작해도 괜찮아요
            </h2>
            <p className="text-lg leading-[1.7] text-muted-2">괜찮은 척하지 않아도 되는 곳, magic.ai가 들을게요.</p>
            <PrimaryButton href="/dashboard/counsel" className="mt-2">상담 시작하기</PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line pt-12 pb-10 lg:pt-[72px]">
      <div className={`${container} flex flex-col gap-10`}>
        <div className="flex flex-col gap-5 rounded-3xl bg-brand-tint p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-accent-tint text-[#e06c00]">
              <Icon name="phone" className="size-[22px]" />
            </span>
            <div>
              <p className="text-xl font-extrabold">지금 많이 힘들다면, 혼자 견디지 마세요</p>
              <p className="mt-0.5 text-[15px] text-muted-2">아래 번호는 24시간 연결돼요.</p>
            </div>
          </div>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
            {CRISIS.map((c) => (
              <a key={c.tel} href={`tel:${c.tel}`} className="flex flex-col gap-1 rounded-2xl border border-brand-soft bg-white px-5 py-[18px] hover:border-brand">
                <span className="text-[28px] font-extrabold tracking-[-0.01em]">{c.num}</span>
                <span className="text-[15px] text-muted-2">{c.label}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-6">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-3">
            <p className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-[-0.02em]">
                magic<span className="text-brand-ink">.ai</span>
              </span>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-deep">BETA</span>
            </p>
            <p className="max-w-[560px] text-[15px] leading-[1.7] text-muted">
              magic.ai는 전문 심리상담이나 의료 서비스를 대체하지 않습니다. 진단이나 치료가 필요하다면 전문가와 상담해 주세요. 지금은 베타 서비스로, 기능이 바뀌거나 잠시 멈출 수 있어요.
            </p>
            <address className="text-sm leading-[1.8] text-muted not-italic">
              {COMPANY.name} · 대표이사 {COMPANY.ceo} · 사업자등록번호 {COMPANY.bizNo}
              <br />
              {COMPANY.address}
              <br />
              문의{" "}
              <a href={`mailto:${COMPANY.email}`} className="underline hover:text-ink">
                {COMPANY.email}
              </a>{" "}
              (서비스 문의 전용 · 위기 상황은 109)
            </address>
            <p className="text-sm text-muted">© 2026 {COMPANY.nameEn} All Rights Reserved</p>
          </div>
          <nav aria-label="정책" className="flex items-start gap-6 text-[15px]">
            <Link href="/privacy" className="font-bold">개인정보처리방침</Link>
            <Link href="/terms" className="text-muted-2">이용약관</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
