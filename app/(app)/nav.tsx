"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays, ClipboardCheck, LayoutDashboard, List, Users,
} from "lucide-react";

const ICONS = {
  home: LayoutDashboard,
  week: CalendarDays,
  mine: ClipboardCheck,
  all: List,
  team: Users,
};

export type NavLink = {
  href: string;
  label: string;
  short: string;
  icon: keyof typeof ICONS;
};

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  links,
  collapsed = false,
}: {
  links: NavLink[];
  collapsed?: boolean;
}) {
  const isActive = useIsActive();
  return (
    <nav className="space-y-1 text-sm">
      {links.map((l) => {
        const Icon = ICONS[l.icon];
        const active = isActive(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            title={collapsed ? l.label : undefined}
            className={`flex items-center rounded-lg py-2.5 transition-colors ${collapsed ? "justify-center px-0" : "gap-2.5 px-3"
              } ${active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && l.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ links }: { links: NavLink[] }) {
  const isActive = useIsActive();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="flex">
        {links.map((l) => {
          const Icon = ICONS[l.icon];
          const active = isActive(l.href);
          return (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                className={`flex flex-col items-center gap-1 py-2 text-[11px] ${active ? "font-medium text-primary" : "text-muted-foreground"
                  }`}
              >
                <Icon className="h-5 w-5" />
                {l.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}