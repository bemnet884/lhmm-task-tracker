import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { dayKey } from "@/lib/dates";
import { getPickerUsers, taskInclude, toTaskView } from "@/lib/task-queries";
import { TaskTable } from "../tasks/task-table";

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const user = await requireUser();
  const { task } = await searchParams;
  const isAdmin = user.role === "ADMIN";

  const tasks = await prisma.task.findMany({
    where: { assignees: { some: { userId: user.id } } },
    orderBy: { dueDate: "asc" },
    include: taskInclude,
  });

  return (
    <TaskTable
      tasks={tasks.map(toTaskView)}
      title="My tasks"
      subtitle="Tasks assigned to you. Change a status right from the list."
      currentUserId={user.id}
      isAdmin={isAdmin}
      users={isAdmin ? await getPickerUsers() : []}
      defaultStatus="OPEN"
      defaultSort="asc"
      showAssigneeFilter={false}
      newTaskDue={`${dayKey(new Date())}T09:00`}
      openTaskId={task}
    />
  );
}