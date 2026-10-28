import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { relativeTime } from "@/lib/dates";
import { initials } from "@/lib/initials";
import { Logo } from "@/components/logo";
import { BottomNav, SidebarNav, type NavLink } from "./nav";
import { NotificationSheet, type NotificationView } from "./notification-sheet";
import { SignOutButton } from "./sign-out-button";

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

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-56 shrink-0 border-r p-4 md:block">
        <Logo className="mb-6" />
        <SidebarNav links={links} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <Logo className="md:hidden" text={false} />
          <div className="ml-auto flex items-center gap-2">
            <NotificationSheet count={unread} items={items} />
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                {initials(user.name)}
              </span>
              <span className="hidden md:inline">{user.name}</span>
            </Link>
            <SignOutButton className="hidden md:inline-flex" />
          </div>
        </header>

        {/* bottom padding leaves room for the mobile tab bar */}
        <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>

      <BottomNav links={links} />
    </div>
  );
}