import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { dayKey, dayLabel, timeLabel, toInputValue } from "./dates";
import type { PickerUser, TaskView } from "./task-types";

export const taskInclude = {
  assignees: { include: { user: { select: { id: true, name: true } } } },
} satisfies Prisma.TaskInclude;

type TaskRow = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export function toTaskView(t: TaskRow): TaskView {
  const key = dayKey(t.dueDate);
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    category: t.category,
    status: t.status,
    priority: t.priority,
    fileLink: t.fileLink,
    dayKey: key,
    dueInput: toInputValue(t.dueDate),
    timeLabel: timeLabel(t.dueDate),
    dueLabel: `${dayLabel(key)} · ${timeLabel(t.dueDate)}`,
    overdue: t.status !== "DONE" && t.dueDate < new Date(),
    assignees: t.assignees.map((a) => ({ id: a.user.id, name: a.user.name })),
  };
}

export async function getPickerUsers(): Promise<PickerUser[]> {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          assignments: { where: { task: { status: { not: "DONE" } } } },
        },
      },
    },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    openTasks: u._count.assignments,
  }));
}
