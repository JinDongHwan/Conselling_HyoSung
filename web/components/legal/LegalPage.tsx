import Link from "next/link";
import { COMPANY, POLICY_EFFECTIVE_DATE } from "@/lib/company";
import { Logo } from "../Logo";

// 개인정보처리방침·이용약관 공통 틀. 본문(PrivacyBody/TermsBody)은 가입 화면에서도 그대로 쓴다.

// 본문 글자·표 스타일 (페이지와 가입 화면 스크롤 상자에서 공통). 글자 크기·간격은 쓰는 곳에서 정한다.
export const LEGAL_PROSE =
  "text-ink-2 [&_h2]:mb-3 [&_h2]:font-bold [&_h2]:text-ink [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:border-line [&_td]:p-2.5 [&_td]:align-top [&_th]:border [&_th]:border-line [&_th]:bg-surface-2 [&_th]:p-2.5 [&_th]:text-left [&_ul]:list-disc [&_ul]:pl-5";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 bg-page">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Logo />
          <nav className="flex gap-4 text-sm font-semibold text-muted">
            <Link href="/privacy" className="hover:text-ink">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-ink">이용약관</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted">시행일: {POLICY_EFFECTIVE_DATE}</p>
        <div className={`mt-6 space-y-10 text-[15px] leading-7 [&_h2]:text-lg ${LEGAL_PROSE}`}>{children}</div>
        <p className="mt-14 border-t border-line pt-6 text-sm text-muted">
          {COMPANY.name} · 대표이사 {COMPANY.ceo} · 문의 <a href={`mailto:${COMPANY.email}`} className="underline">{COMPANY.email}</a>
        </p>
      </main>
    </div>
  );
}

export function Intro({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-surface-2 p-5 text-ink">{children}</div>;
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
