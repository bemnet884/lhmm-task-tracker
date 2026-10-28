import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addDays, dayKey, mondayOf, startOfDay } from "@/lib/dates";
import { getPickerUsers, taskInclude, toTaskView } from "@/lib/task-queries";
import { CATEGORIES, STATUSES } from "@/lib/task-constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function Stat({
  label, value, href, danger,
}: {
  label: string;
  value: number;
  href?: string;
  danger?: boolean;
}) {
  const card = (
    <Card className="h-full transition-colors hover:border-primary">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-3xl ${danger && value > 0 ? "text-red-600" : ""}`}>
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const now = new Date();
  const today = dayKey(now);
  const dayStart = startOfDay(today);
  const dayEnd = startOfDay(addDays(today, 1));
  const weekStart = startOfDay(mondayOf(today));

  const mine = { assignees: { some: { userId: user.id } } };
  const open = { status: { not: "DONE" as const } };

  const [myOpen, dueToday, overdue, doneThisWeek, upNext] = await Promise.all([
    prisma.task.count({ where: { ...mine, ...open } }),
    prisma.task.count({
      where: { ...mine, ...open, dueDate: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.task.count({ where: { ...mine, ...open, dueDate: { lt: now } } }),
    prisma.task.count({
      where: { ...mine, status: "DONE", updatedAt: { gte: weekStart } },
    }),
    prisma.task.findMany({
      where: { ...mine, ...open },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: taskInclude,
    }),
  ]);

  const team = isAdmin
    ? await Promise.all([
      prisma.task.count({ where: open }),
      prisma.task.count({ where: { ...open, dueDate: { lt: now } } }),
      prisma.task.count({
        where: { status: "DONE", updatedAt: { gte: weekStart } },
      }),
      getPickerUsers(),
    ])
    : null;

  const upNextViews = upNext.map(toTaskView);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground">Here's where things stand.</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">My tasks</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Open tasks" value={myOpen} href="/my-tasks" />
          <Stat label="Due today" value={dueToday} href="/my-tasks" />
          <Stat label="Overdue" value={overdue} href="/my-tasks" danger />
          <Stat label="Completed this week" value={doneThisWeek} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Up next</h2>
        {upNextViews.length === 0 ? (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            You're all caught up. Nothing is waiting on you.
          </p>
        ) : (
          <div className="divide-y rounded-md border">
            {upNextViews.map((t) => (
              <Link
                key={t.id}
                href={`/my-tasks?task=${t.id}`}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm hover:bg-muted"
              >
                <div className="space-y-1">
                  <div className="font-medium">{t.title}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`rounded px-1.5 py-0.5 ${CATEGORIES[t.category].color}`}>
                      {CATEGORIES[t.category].label}
                    </span>
                    <span className="text-muted-foreground">{t.dueLabel}</span>
                    {t.overdue && <span className="text-red-600">Overdue</span>}
                  </div>
                </div>
                <Badge variant="outline">{STATUSES[t.status]}</Badge>
              </Link>
            ))}
          </div>
        )}
      </section>

      {team && (
        <section className="space-y-3">
          <h2 className="font-medium">Whole team</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Open tasks" value={team[0]} href="/tasks" />
            <Stat label="Overdue" value={team[1]} href="/tasks" danger />
            <Stat label="Completed this week" value={team[2]} />
          </div>

          <div className="rounded-md border">
            <div className="border-b px-3 py-2 text-sm font-medium">Workload</div>
            <div className="divide-y">
              {team[3].map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span>{u.name}</span>
                  <span className="text-muted-foreground">{u.openTasks} open</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}