import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { ArchiveIcon, ChartIcon, ChatIcon, HomeIcon, UserIcon } from "@/components/icons";
import { SideNav } from "@/components/SideNav";
import { guardianPending, needsOnboarding, requireProfile } from "@/lib/auth";
import { DEMO_MODE } from "@/lib/config";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const profile = await requireProfile();
  if (needsOnboarding(profile)) redirect("/onboarding");
  if (await guardianPending(profile)) redirect("/onboarding/guardian");

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <SideNav
        home="/dashboard"
        badge={DEMO_MODE ? "데모" : undefined}
        items={[
          { href: "/dashboard", label: "홈", icon: <HomeIcon />, exact: true },
          { href: "/dashboard/counsel", label: "심리상담", icon: <ChatIcon /> },
          { href: "/dashboard/records", label: "과거 기록", icon: <ArchiveIcon /> },
          { href: "/dashboard/data", label: "데이터", icon: <ChartIcon /> },
          { href: "/dashboard/mypage", label: "마이페이지", icon: <UserIcon /> },
        ]}
        footer={
          <div className="space-y-3 border-t border-line pt-4 text-sm">
            <div className="rounded-xl bg-danger-soft px-3 py-2.5">
              <p className="font-semibold text-danger">힘든 순간엔</p>
              <p className="mt-0.5">
                <a href="tel:109" className="font-bold">109</a> 자살예방상담 (24시간)
              </p>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="truncate text-muted">{profile.nickname ?? "나"}님</span>
              <div className="flex gap-3">
                {profile.role === "admin" && (
                  <Link href="/admin" className="text-muted hover:text-ink">관리자</Link>
                )}
                <form action={signOut}>
                  <button className="text-muted hover:text-ink">로그아웃</button>
                </form>
              </div>
            </div>
          </div>
        }
      />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
