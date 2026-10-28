"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { markAllRead, markRead } from "./notifications/actions";

export type NotificationView = {
  id: string;
  message: string;
  link: string | null;
  read: boolean;
  time: string;
};

export function NotificationSheet({
  count,
  items,
}: {
  count: number;
  items: NotificationView[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // pick up new notifications without a manual reload
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(id);
  }, [router]);

  function openItem(n: NotificationView) {
    startTransition(async () => {
      if (!n.read) await markRead(n.id);
      setOpen(false);
      if (n.link) router.push(n.link);
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
      >
        <Bell className="h-4.5 w-4.5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b p-4 pr-12">
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              {count > 0 ? `${count} unread` : "You're all caught up"}
            </SheetDescription>
          </SheetHeader>

          {count > 0 && (
            <div className="flex justify-end border-b px-4 py-1.5">
              <Button
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => startTransition(() => markAllRead())}
              >
                Mark all as read
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-sm text-muted-foreground">
                  You'll see assignments, status changes and comments here.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  disabled={pending}
                  onClick={() => openItem(n)}
                  className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left text-sm transition-colors hover:bg-muted/60 ${n.read ? "" : "bg-primary/5"
                    }`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"
                      }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block ${n.read ? "text-muted-foreground" : "font-medium"
                        }`}
                    >
                      {n.message}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {n.time}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}