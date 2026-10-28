import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { relativeTime } from "@/lib/dates";
import { initials } from "@/lib/initials";
import { Logo } from "@/components/logo";
import { BottomNav, type NavLink } from "./nav";
import { NotificationSheet, type NotificationView } from "./notification-sheet";
import { Sidebar } from "./sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const [unread, recent] = await Promise.all([
    prisma.notification.count({ where: { userId: user.id, read: false } }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const items: NotificationView[] = recent.map((n) => ({
    id: n.id,
    message: n.message,
    link: n.link,
    read: n.read,
    time: relativeTime(n.createdAt),
  }));

  const links: NavLink[] = [
    { href: "/dashboard", label: "Dashboard", short: "Home", icon: "home" },
    { href: "/week", label: "Week", short: "Week", icon: "week" },
    { href: "/my-tasks", label: "My tasks", short: "Mine", icon: "mine" },
    { href: "/tasks", label: "All tasks", short: "All", icon: "all" },
    ...(user.role === "ADMIN"
      ? [{ href: "/admin/team", label: "Team", short: "Team", icon: "team" } as NavLink]
      : []),
  ];

  const userInitials = initials(user.name);

  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar
        links={links}
        user={{
          name: user.name,
          role: user.role === "ADMIN" ? "Admin" : "Member",
          initials: userInitials,
        }}
        bell={<NotificationSheet count={unread} items={items} />}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile-only top bar; on desktop everything lives in the sidebar */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-background/80 px-4 backdrop-blur md:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <NotificationSheet count={unread} items={items} />
            <Link href="/profile" aria-label="Profile">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {userInitials}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-8">{children}</main>
      </div>

      <BottomNav links={links} />
    </div>
  );
}