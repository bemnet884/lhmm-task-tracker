"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/task-constants";
import { createTask, updateTask, deleteTask } from "../tasks/actions";
import type { BoardTask, PickerUser } from "./week-board";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

export function TaskDialog({
  open, onOpenChange, task, defaultDue, users,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: BoardTask | null;
  defaultDue: string;
  users: PickerUser[];
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const data = {
      title: String(f.get("title")),
      description: String(f.get("description") ?? ""),
      category: String(f.get("category")),
      priority: String(f.get("priority")),
      status: task ? String(f.get("status")) : undefined,
      due: String(f.get("due")),
      fileLink: String(f.get("fileLink") ?? ""),
      assigneeIds: f.getAll("assignee").map(String),
    };

    startTransition(async () => {
      const res = task ? await updateTask(task.id, data) : await createTask(data);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(task ? "Task updated" : "Task created");
      onOpenChange(false);
    });
  }

  function onDelete() {
    if (!task || !confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    startTransition(async () => {
      const res = await deleteTask(task.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Task deleted");
      onOpenChange(false);
    });
  }

  const assigned = new Set(task?.assignees.map((a) => a.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Assign one or more people. They'll be notified.
          </DialogDescription>
        </DialogHeader>

        <form key={task?.id ?? `new-${defaultDue}`} onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={task?.title} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                className={selectClass}
                defaultValue={task?.category ?? "SHOOT"}
              >
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                className={selectClass}
                defaultValue={task?.priority ?? "MEDIUM"}
              >
                {Object.entries(PRIORITIES).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="due">Due</Label>
              <Input
                id="due"
                name="due"
                type="datetime-local"
                defaultValue={task?.dueInput ?? defaultDue}
                required
              />
            </div>
            {task && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className={selectClass}
                  defaultValue={task.status}
                >
                  {Object.entries(STATUSES).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileLink">File / footage link (optional)</Label>
            <Input
              id="fileLink"
              name="fileLink"
              type="url"
              placeholder="https://drive.google.com/..."
              defaultValue={task?.fileLink ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label>Assignees</Label>
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm hover:bg-muted"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="assignee"
                      value={u.id}
                      defaultChecked={assigned.has(u.id)}
                    />
                    {u.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {u.openTasks} open
                  </span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {task ? (
              <Button
                type="button"
                variant="destructive"
                disabled={pending}
                onClick={onDelete}
              >
                Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}