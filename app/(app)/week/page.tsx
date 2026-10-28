import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { addDays, dayKey, dayLabel, mondayOf, startOfDay, weekDays } from "@/lib/dates";
import { getPickerUsers, taskInclude, toTaskView } from "@/lib/task-queries";
import { WeekBoard } from "./week-board";

export default async function WeekPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const user = await requireUser();
  const { start } = await searchParams;

  const today = dayKey(new Date());
  const anchor = start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : today;
  const monday = mondayOf(anchor);
  const days = weekDays(monday);

  const tasks = await prisma.task.findMany({
    where: {
      dueDate: { gte: startOfDay(monday), lt: startOfDay(addDays(monday, 7)) },
    },
    orderBy: { dueDate: "asc" },
    include: taskInclude,
  });

  const isAdmin = user.role === "ADMIN";

  return (
    <WeekBoard
      tasks={tasks.map(toTaskView)}
      days={days.map((key) => ({ key, label: dayLabel(key) }))}
      today={today}
      prevStart={addDays(monday, -7)}
      nextStart={addDays(monday, 7)}
      rangeLabel={`${dayLabel(days[0])} – ${dayLabel(days[6])}`}
      isAdmin={isAdmin}
      currentUserId={user.id}
      users={isAdmin ? await getPickerUsers() : []}
    />
  );
}