"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Logo } from "@/components/logo";
import { SidebarNav, type NavLink } from "./nav";
import { SignOutButton } from "./sign-out-button";

const KEY = "sidebar-collapsed";

export function Sidebar({
  links,
  user,
  bell,
}: {
  links: NavLink[];
  user: { name: string; role: string; initials: string };
  bell: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(KEY) === "1");
    } catch { }
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch { }
  }

  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  const avatar = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
      {user.initials}
    </span>
  );

  return (
    <aside
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col bg-card p-3 transition-[width] duration-200 md:flex ${collapsed ? "w-[72px]" : "w-60"
        }`}
    >
      <div className={`mb-6 mt-1 ${collapsed ? "flex justify-center" : "px-2"}`}>
        <Logo text={!collapsed} />
      </div>

      <SidebarNav links={links} collapsed={collapsed} />

      <div className="mt-auto space-y-2">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`flex w-full items-center rounded-lg py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${collapsed ? "justify-center" : "gap-2.5 px-3"
            }`}
        >
          <ToggleIcon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && "Collapse"}
        </button>

        {collapsed ? (
          <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/60 py-2">
            {bell}
            <Link href="/profile" title={user.name} aria-label="Profile">
              {avatar}
            </Link>
            <SignOutButton iconOnly />
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-2">
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg"
            >
              {avatar}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium leading-tight">
                  {user.name}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {user.role}
                </span>
              </span>
            </Link>
            {bell}
            <SignOutButton iconOnly />
          </div>
        )}
      </div>
    </aside>
  );
}