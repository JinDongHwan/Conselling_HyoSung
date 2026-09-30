import Link from "next/link";

// 워드마크: 보라 별빛 마크 + magic.ai (onDark: 보라 배경 위에서 흰색)
export function Logo({ href = "/", className = "", onDark = false }: { href?: string; className?: string; onDark?: boolean }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-[22px] font-extrabold tracking-tight ${onDark ? "text-white" : "text-ink"} ${className}`}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-6">
        <path
          fill={onDark ? "#ffffff" : "var(--brand)"}
          d="M12 2c.5 4.6 2.4 6.9 7 7.5-4.6.6-6.5 2.9-7 7.5-.5-4.6-2.4-6.9-7-7.5 4.6-.6 6.5-2.9 7-7.5Z"
        />
        <circle cx="19" cy="19" r="2.2" fill="var(--accent)" />
      </svg>
      magic.ai
    </Link>
  );
}
