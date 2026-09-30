import Link from "next/link";
import { signOut } from "@/app/actions";
import { AlertIcon, BookIcon, HomeIcon, ReportIcon, UsersIcon } from "@/components/icons";
import { SideNav } from "@/components/SideNav";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <SideNav
        home="/admin"
        badge="관리자"
        items={[
          { href: "/admin", label: "운영 현황", icon: <HomeIcon />, exact: true },
          { href: "/admin/alerts", label: "위기 알림", icon: <AlertIcon /> },
          { href: "/admin/users", label: "사용자 관리", icon: <UsersIcon /> },
          { href: "/admin/knowledge", label: "지식베이스", icon: <BookIcon /> },
          { href: "/admin/reports", label: "리포트", icon: <ReportIcon /> },
        ]}
        footer={
          <div className="flex items-center justify-between border-t border-line px-1 pt-4 text-sm">
            <span className="truncate text-muted">{admin.nickname ?? "관리자"}</span>
            <div className="flex gap-3">
              <Link href="/dashboard" className="text-muted hover:text-ink">사용자 화면</Link>
              <form action={signOut}>
                <button className="text-muted hover:text-ink">로그아웃</button>
              </form>
            </div>
          </div>
        }
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
