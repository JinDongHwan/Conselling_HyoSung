import { profileAgeBand } from "@/lib/age";
import { isBanned } from "@/lib/auth";
import { POLICY_VERSION } from "@/lib/company";
import type { AdminUser } from "@/lib/types";

// 사용자 상태 표시: 관리자 · 정지 · 시작 설정 전 · 약관 재동의 필요
export function StatusBadges({ user }: { user: AdminUser }) {
  return (
    <span className="flex flex-wrap gap-1">
      {user.role === "admin" && <span className="rounded-full bg-dark px-2 py-0.5 text-xs font-semibold text-page">관리자</span>}
      {profileAgeBand(user) === "under14" && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold">만 14세 미만</span>}
      {profileAgeBand(user) === "teen" && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-strong">청소년</span>}
      {user.org_id && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">기관</span>}
      {isBanned(user.banned_until) && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">정지</span>}
      {!user.birth_year && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">시작 설정 전</span>}
      {user.birth_year && user.policy_version !== POLICY_VERSION && (
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs">약관 재동의 필요</span>
      )}
    </span>
  );
}
