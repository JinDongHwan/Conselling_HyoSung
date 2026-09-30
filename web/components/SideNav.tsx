"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";

export type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

export function SideNav({
  items,
  home,
  footer,
  badge,
}: {
  items: NavItem[];
  home: string;
  footer?: React.ReactNode;
  badge?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (i: NavItem) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/"));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          onClick={() => setOpen(false)}
          aria-current={isActive(i) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] ${
            isActive(i) ? "bg-brand-soft font-semibold text-brand-strong" : "text-muted hover:bg-surface-2 hover:text-ink"
          }`}
        >
          <span aria-hidden className="size-5 shrink-0">{i.icon}</span>
          {i.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* 모바일 상단 바 */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Logo href={home} />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="메뉴"
          className="rounded-lg p-2 hover:bg-surface-2"
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="fixed inset-x-0 top-14 z-30 flex max-h-[calc(100vh-3.5rem)] flex-col gap-4 overflow-y-auto border-b border-line bg-surface p-4 lg:hidden">
          {nav}
          {footer}
        </div>
      )}

      {/* 데스크탑 사이드바 */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-8 border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="flex items-center justify-between px-2">
          <Logo href={home} />
          {badge && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold">{badge}</span>}
        </div>
        {nav}
        {footer}
      </aside>
    </>
  );
}
