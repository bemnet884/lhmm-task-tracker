"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/task-constants";
import type { PickerUser, TaskView } from "@/lib/task-types";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { TaskDialog } from "../week/task-dialog";
import { updateStatus } from "./actions";
import { NativeSelect } from "@/components/native-select";


export function TaskTable({
  tasks, title, subtitle, currentUserId, isAdmin, users,
  defaultStatus, defaultSort, showAssigneeFilter, newTaskDue, openTaskId
}: {
  tasks: TaskView[];
  title: string;
  subtitle: string;
  currentUserId: string;
  isAdmin: boolean;
  users: PickerUser[];
  defaultStatus: string; // "ALL" | "OPEN" | a status key
  defaultSort: "asc" | "desc";
  showAssigneeFilter: boolean;
  newTaskDue: string;
  openTaskId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState(defaultStatus);
  const [assignee, setAssignee] = useState("ALL");
  const [sort, setSort] = useState(defaultSort);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskView | null>(null);

  const [detailId, setDetailId] = useState<string | null>(openTaskId ?? null);
  useEffect(() => {
    if (openTaskId) setDetailId(openTaskId);
  }, [openTaskId]);

  const detail = tasks.find((t) => t.id === detailId) ?? null;

  const assigneeOptions = useMemo(() => {
    const map = new Map<string, string>();
    tasks.forEach((t) => t.assignees.forEach((a) => map.set(a.id, a.name)));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [tasks]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (
          needle &&
          !t.title.toLowerCase().includes(needle) &&
          !(t.description ?? "").toLowerCase().includes(needle)
        ) {
          return false;
        }
        if (category !== "ALL" && t.category !== category) return false;
        if (status === "OPEN" && t.status === "DONE") return false;
        if (status !== "ALL" && status !== "OPEN" && t.status !== status) return false;
        if (assignee !== "ALL" && !t.assignees.some((a) => a.id === assignee)) {
          return false;
        }
        return true;
      })
      .sort((a, b) =>
        sort === "asc"
          ? a.dueInput.localeCompare(b.dueInput)
          : b.dueInput.localeCompare(a.dueInput)
      );
  }, [tasks, q, category, status, assignee, sort]);

  const canAct = (t: TaskView) =>
    isAdmin || t.assignees.some((a) => a.id === currentUserId);

  function changeStatus(t: TaskView, value: string) {
    startTransition(async () => {
      const res = await updateStatus(t.id, value);
      if (!res.ok) toast.error(res.error);
    });
  }

  function openEdit(t: TaskView) {
    setDetailId(null);
    setEditing(t);
    setDialogOpen(true);
  }

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {isAdmin && <Button onClick={openNew}>New task</Button>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-full sm:w-64"
          placeholder="Search tasks..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <NativeSelect
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="ALL">All categories</option>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ALL">All statuses</option>
          <option value="OPEN">Not done</option>
          {Object.entries(STATUSES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </NativeSelect>
        {showAssigneeFilter && (
          <NativeSelect
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="ALL">Everyone</option>
            {assigneeOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </NativeSelect>
        )}
        <Button
          variant="outline"
          onClick={() => setSort(sort === "asc" ? "desc" : "asc")}
        >
          Due date {sort === "asc" ? "↑" : "↓"}
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">
          {rows.length} task{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="hidden rounded-md border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Assigned to</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  No tasks match these filters.
                </TableCell>
              </TableRow>
            )}
            {rows.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <button
                    type="button"
                    className={`text-left font-medium hover:underline ${t.status === "DONE" ? "text-muted-foreground line-through" : ""
                      }`}
                    onClick={() => setDetailId(t.id)}
                  >
                    {t.title}
                  </button>
                  <div className="mt-1">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${CATEGORIES[t.category].color}`}
                    >
                      {CATEGORIES[t.category].label}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {t.dueLabel}
                  {t.overdue && (
                    <div className="text-xs text-red-600">Overdue</div>
                  )}
                </TableCell>
                <TableCell>{t.assignees.map((a) => a.name).join(", ")}</TableCell>
                <TableCell>{PRIORITIES[t.priority]}</TableCell>
                <TableCell>
                  {canAct(t) ? (
                    <NativeSelect
                      value={t.status}
                      disabled={pending}
                      onChange={(e) => changeStatus(t, e.target.value)}
                    >
                      {Object.entries(STATUSES).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </NativeSelect>
                  ) : (
                    <Badge variant="outline">{STATUSES[t.status]}</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-2 md:hidden">
        {rows.length === 0 && (
          <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
            No tasks match these filters.
          </p>
        )}
        {rows.map((t) => (
          <div key={t.id} className="space-y-3 rounded-lg border p-3">
            <button
              type="button"
              onClick={() => setDetailId(t.id)}
              className="block w-full text-left"
            >
              <div
                className={`font-medium ${t.status === "DONE" ? "text-muted-foreground line-through" : ""
                  }`}
              >
                {t.title}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded px-1.5 py-0.5 ${CATEGORIES[t.category].color}`}>
                  {CATEGORIES[t.category].label}
                </span>
                <span className="text-muted-foreground">{t.dueLabel}</span>
                {t.overdue && <span className="text-red-600">Overdue</span>}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t.assignees.map((a) => a.name).join(", ")}
              </div>
            </button>
            {canAct(t) ? (
              <NativeSelect
                className={`h-10 w-full`}
                value={t.status}
                disabled={pending}
                onChange={(e) => changeStatus(t, e.target.value)}
              >
                {Object.entries(STATUSES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </NativeSelect>
            ) : (
              <Badge variant="outline">{STATUSES[t.status]}</Badge>
            )}
          </div>
        ))}
      </div>

      <TaskDetailSheet
        task={detail}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        onClose={() => setDetailId(null)}
        onEdit={openEdit}
      />

      {isAdmin && (
        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          task={editing}
          defaultDue={newTaskDue}
          users={users}
        />
      )}
    </div>
  );
}