import Link from "next/link";
import { StarMark } from "./Mascot";

// 워드마크: 마스코트 별 마크 + magic.ai (onDark: 보라 배경 위에서 흰색)
export function Logo({ href = "/", className = "", onDark = false }: { href?: string; className?: string; onDark?: boolean }) {
  return (
    <Link
      href={href}
      aria-label="magic.ai 홈"
      className={`inline-flex items-center gap-2 text-[22px] font-extrabold tracking-tight ${onDark ? "text-white" : "text-ink"} ${className}`}
    >
      <StarMark className="size-7" color={onDark ? "#ffffff" : "#7761FF"} />
      <span>
        magic<span className={onDark ? "" : "text-brand-ink"}>.ai</span>
      </span>
    </Link>
  );
}
