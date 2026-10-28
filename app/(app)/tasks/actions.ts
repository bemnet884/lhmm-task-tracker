"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { notify } from "@/lib/notify";
import { timeLabel, parseInputValue } from "@/lib/dates";
import { STATUSES } from "@/lib/task-constants";
import type { CommentView } from "@/lib/task-types";

type Result = { ok: true } | { ok: false; error: string };

function refreshAll() {
  for (const p of ["/week", "/tasks", "/my-tasks", "/dashboard"])
    revalidatePath(p);
}

const taskSchema = z.object({
  title: z.string().trim().min(2, "Title is too short"),
  description: z.string().trim().optional(),
  category: z.enum(["SHOOT", "EDITING", "POSTING", "SOCIAL"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  due: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Pick a due date and time"),
  fileLink: z
    .union([z.string().trim().url("Link must be a valid URL"), z.literal("")])
    .optional(),
  assigneeIds: z.array(z.string()).min(1, "Assign at least one person"),
});

async function validAssignees(ids: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: ids }, active: true },
    select: { id: true },
  });
  return users.length === ids.length;
}

export async function createTask(input: unknown): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (!(await validAssignees(d.assigneeIds))) {
    return { ok: false, error: "One of the selected members is not available" };
  }

  const task = await prisma.task.create({
    data: {
      title: d.title,
      description: d.description || null,
      category: d.category,
      priority: d.priority,
      dueDate: parseInputValue(d.due),
      fileLink: d.fileLink || null,
      createdById: admin.id,
      assignees: { create: d.assigneeIds.map((userId) => ({ userId })) },
    },
  });

  await notify(
    d.assigneeIds.filter((id) => id !== admin.id),
    `You were assigned: ${task.title}`,
    "/tasks?task=${task.id}"
  );
  refreshAll();
  return { ok: true };
}

export async function updateTask(id: string, input: unknown): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (!(await validAssignees(d.assigneeIds))) {
    return { ok: false, error: "One of the selected members is not available" };
  }

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { assignees: { select: { userId: true } } },
  });
  if (!existing) return { ok: false, error: "Task not found" };
  const before = new Set(existing.assignees.map((a) => a.userId));

  await prisma.task.update({
    where: { id },
    data: {
      title: d.title,
      description: d.description || null,
      category: d.category,
      priority: d.priority,
      status: d.status,
      dueDate: parseInputValue(d.due),
      fileLink: d.fileLink || null,
      assignees: {
        deleteMany: {},
        create: d.assigneeIds.map((userId) => ({ userId })),
      },
    },
  });

  // only notify people who were newly added
  await notify(
    d.assigneeIds.filter((uid) => !before.has(uid) && uid !== admin.id),
    `You were assigned: ${d.title}`,
    "/tasks?task=${id}"
  );
  refreshAll();
  return { ok: true };
}

export async function deleteTask(id: string): Promise<Result> {
  await requireAdmin();
  await prisma.task.delete({ where: { id } });
  refreshAll();
  return { ok: true };
}

const statusSchema = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]);

// Admins and assigned members may change status / link
async function loadForActor(id: string) {
  const user = await requireUser();
  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      title: true,
      createdById: true,
      assignees: { select: { userId: true } },
    },
  });
  if (!task) return { user, task: null, allowed: false };
  const allowed =
    user.role === "ADMIN" || task.assignees.some((a) => a.userId === user.id);
  return { user, task, allowed };
}

export async function updateStatus(
  id: string,
  status: string
): Promise<Result> {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status" };

  const { user, task, allowed } = await loadForActor(id);
  if (!task) return { ok: false, error: "Task not found" };
  if (!allowed)
    return { ok: false, error: "Only assigned members can change the status" };

  await prisma.task.update({ where: { id }, data: { status: parsed.data } });

  const recipients = new Set([
    task.createdById,
    ...task.assignees.map((a) => a.userId),
  ]);
  recipients.delete(user.id);
  await notify(
    [...recipients],
    `${user.name} set "${task.title}" to ${STATUSES[parsed.data]}`,
    "/tasks?task=${id}"
  );
  refreshAll();
  return { ok: true };
}

export async function updateFileLink(
  id: string,
  link: string
): Promise<Result> {
  const parsed = z
    .union([z.string().trim().url("Link must be a valid URL"), z.literal("")])
    .safeParse(link.trim());
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const { task, allowed } = await loadForActor(id);
  if (!task) return { ok: false, error: "Task not found" };
  if (!allowed)
    return { ok: false, error: "Only assigned members can edit the link" };

  await prisma.task.update({
    where: { id },
    data: { fileLink: parsed.data || null },
  });
  refreshAll();
  return { ok: true };
}

export async function addComment(
  taskId: string,
  text: string
): Promise<Result> {
  const user = await requireUser();
  const parsed = z
    .string()
    .trim()
    .min(1, "Write something first")
    .max(2000, "Comment is too long")
    .safeParse(text);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0].message };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      title: true,
      createdById: true,
      assignees: { select: { userId: true } },
    },
  });
  if (!task) return { ok: false, error: "Task not found" };

  await prisma.comment.create({
    data: { text: parsed.data, taskId, authorId: user.id },
  });

  const recipients = new Set([
    task.createdById,
    ...task.assignees.map((a) => a.userId),
  ]);
  recipients.delete(user.id);
  await notify(
    [...recipients],
    `${user.name} commented on "${task.title}"`,
    "/tasks?task=${taskId}"
  );
  return { ok: true };
}

export async function getComments(taskId: string): Promise<CommentView[]> {
  await requireUser();
  const rows = await prisma.comment.findMany({
    where: { taskId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true } } },
  });
  return rows.map((c) => ({
    id: c.id,
    text: c.text,
    author: c.author.name,
    time: timeLabel(c.createdAt),
  }));
}
