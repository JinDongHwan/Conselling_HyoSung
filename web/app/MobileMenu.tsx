"use client";

import { useRef } from "react";

// 랜딩 모바일 메뉴: details로 펼치고, 메뉴를 누르면 닫는다
export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref}>
      <summary aria-label="메뉴 열기" className="grid size-11 cursor-pointer list-none place-items-center rounded-xl bg-brand-tint [&::-webkit-details-marker]:hidden">
        <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </summary>
      <nav
        aria-label="모바일 메뉴"
        className="absolute inset-x-0 top-[72px] flex flex-col border-t border-[#f2f4f7] bg-page px-5 pt-2 pb-5 text-[17px] font-semibold shadow-[0_12px_24px_rgba(16,24,40,0.08)]"
      >
        {items.map((it, i) => (
          <a
            key={it.href}
            href={it.href}
            onClick={() => ref.current?.removeAttribute("open")}
            className={`py-3.5 ${i < items.length - 1 ? "border-b border-[#f2f4f7]" : ""}`}
          >
            {it.label}
          </a>
        ))}
      </nav>
    </details>
  );
}
