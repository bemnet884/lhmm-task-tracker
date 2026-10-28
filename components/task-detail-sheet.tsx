"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { CATEGORIES, PRIORITIES, STATUSES, type Status } from "@/lib/task-constants";
import type { CommentView, TaskView } from "@/lib/task-types";
import {
  addComment, getComments, updateFileLink, updateStatus,
} from "@/app/(app)/tasks/actions";

export function TaskDetailSheet({
  task, currentUserId, isAdmin, onClose, onEdit,
}: {
  task: TaskView | null;
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (task: TaskView) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [comments, setComments] = useState<CommentView[] | null>(null);
  const taskId = task?.id;

  useEffect(() => {
    if (!taskId) return;
    let cancelled = false;
    setComments(null);
    getComments(taskId).then((c) => {
      if (!cancelled) setComments(c);
    });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const canAct =
    !!task && (isAdmin || task.assignees.some((a) => a.id === currentUserId));

  function changeStatus(key: Status) {
    if (!task) return;
    const id = task.id;
    startTransition(async () => {
      const res = await updateStatus(id, key);
      if (!res.ok) toast.error(res.error);
    });
  }

  function saveLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!task) return;
    const id = task.id;
    const link = String(new FormData(e.currentTarget).get("fileLink") ?? "");
    startTransition(async () => {
      const res = await updateFileLink(id, link);
      if (!res.ok) toast.error(res.error);
      else toast.success("Link saved");
    });
  }

  function postComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!task) return;
    const form = e.currentTarget;
    const id = task.id;
    const text = String(new FormData(form).get("text") ?? "");
    startTransition(async () => {
      const res = await addComment(id, text);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      form.reset();
      setComments(await getComments(id));
    });
  }

  return (
    <Sheet
      open={!!task}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      {task && (
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{task.title}</SheetTitle>
            <SheetDescription>
              Due {task.dueLabel}
              {task.overdue && <span className="ml-2 text-red-600">Overdue</span>}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs ${CATEGORIES[task.category].color}`}>
                {CATEGORIES[task.category].label}
              </span>
              <Badge variant="outline">{PRIORITIES[task.priority]} priority</Badge>
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => onEdit(task)}
                >
                  Edit task
                </Button>
              )}
            </div>

            {task.description && (
              <p className="whitespace-pre-wrap text-sm">{task.description}</p>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Assigned to</div>
              <div className="flex flex-wrap gap-1">
                {task.assignees.map((a) => (
                  <Badge key={a.id} variant="secondary">
                    {a.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Status</div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STATUSES) as Status[]).map((key) => (
                  <Button
                    key={key}
                    size="sm"
                    variant={task.status === key ? "default" : "outline"}
                    disabled={!canAct || pending}
                    onClick={() => changeStatus(key)}
                  >
                    {STATUSES[key]}
                  </Button>
                ))}
              </div>
              {!canAct && (
                <p className="text-xs text-muted-foreground">
                  Only assigned members can change the status.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">File / footage link</div>
              {canAct ? (
                <form
                  key={`${task.id}-${task.fileLink ?? ""}`}
                  onSubmit={saveLink}
                  className="flex gap-2"
                >
                  <Input
                    name="fileLink"
                    type="url"
                    placeholder="https://drive.google.com/..."
                    defaultValue={task.fileLink ?? ""}
                  />
                  <Button type="submit" variant="outline" disabled={pending}>
                    Save
                  </Button>
                </form>
              ) : null}
              {task.fileLink ? (
                <a
                  href={task.fileLink}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm underline"
                >
                  Open link
                </a>
              ) : (
                !canAct && <p className="text-sm text-muted-foreground">No link yet.</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Comments</div>
              {comments === null ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet.</p>
              ) : (
                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="rounded-md border p-2 text-sm">
                      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{c.author}</span>
                        <span>{c.time}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{c.text}</p>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={postComment} className="space-y-2">
                <Textarea name="text" rows={2} placeholder="Write a comment..." />
                <Button type="submit" size="sm" disabled={pending}>
                  Post comment
                </Button>
              </form>
            </div>
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}