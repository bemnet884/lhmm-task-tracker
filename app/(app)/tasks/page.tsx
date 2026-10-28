import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { dayKey } from "@/lib/dates";
import { getPickerUsers, taskInclude, toTaskView } from "@/lib/task-queries";
import { TaskTable } from "./task-table";

export default async function AllTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const user = await requireUser();
  const { task } = await searchParams;
  const isAdmin = user.role === "ADMIN";

  const tasks = await prisma.task.findMany({
    orderBy: { dueDate: "desc" },
    include: taskInclude,
  });

  return (
    <TaskTable
      tasks={tasks.map(toTaskView)}
      title="All tasks"
      subtitle="Every task, including past weeks."
      currentUserId={user.id}
      isAdmin={isAdmin}
      users={isAdmin ? await getPickerUsers() : []}
      defaultStatus="ALL"
      defaultSort="desc"
      showAssigneeFilter
      newTaskDue={`${dayKey(new Date())}T09:00`}
      openTaskId={task}
    />
  );
}