"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, STATUSES } from "@/lib/task-constants";
import type { PickerUser, TaskView } from "@/lib/task-types";
import { TaskDetailSheet } from "@/components/task-detail-sheet";
import { TaskDialog } from "./task-dialog";

// task-dialog.tsx still imports these names from here
export type BoardTask = TaskView;
export type { PickerUser };

type Props = {
  tasks: TaskView[];
  days: { key: string; label: string }[];
  today: string;
  prevStart: string;
  nextStart: string;
  rangeLabel: string;
  isAdmin: boolean;
  currentUserId: string;
  users: PickerUser[];
};

export function WeekBoard({
  tasks, days, today, prevStart, nextStart, rangeLabel, isAdmin, currentUserId, users,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskView | null>(null);
  const [defaultDue, setDefaultDue] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  // Always read from fresh props so the drawer updates after a status change
  const detail = tasks.find((t) => t.id === detailId) ?? null;

  function openCreate(day: string) {
    setEditing(null);
    setDefaultDue(`${day}T09:00`);
    setDialogOpen(true);
  }

  function openEdit(t: TaskView) {
    setDetailId(null);
    setEditing(t);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Week</h1>
          <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/week?start=${prevStart}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            ← Previous
          </Link>
          <Link
            href="/week"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Today
          </Link>
          <Link
            href={`/week?start=${nextStart}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Next →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-7 lg:gap-2">
        {days.map((day) => {
          const dayTasks = tasks.filter((t) => t.dayKey === day.key);
          const isToday = day.key === today;
          return (
            <div
              key={day.key}
              className={`flex lg:min-h-105 min-w-0 flex-col rounded-lg border p-2 ${isToday ? "border-primary bg-primary/5" : "bg-muted/30"
                }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{day.label}</span>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 lg:h-6 lg:w-6"
                    onClick={() => openCreate(day.key)}
                    aria-label={`Add task on ${day.label}`}
                  >
                    +
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {dayTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDetailId(t.id)}
                    className={`w-full space-y-2 rounded-md border bg-background p-2 text-left text-xs shadow-xs hover:border-primary ${t.status === "DONE" ? "opacity-60" : ""
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span
                        className={`text-sm font-medium leading-tight ${t.status === "DONE" ? "line-through" : ""
                          }`}
                      >
                        {t.title}
                      </span>
                      {t.priority === "HIGH" && (
                        <span className="shrink-0 text-red-600" title="High priority">
                          ●
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={`rounded px-1.5 py-0.5 ${CATEGORIES[t.category].color}`}
                      >
                        {CATEGORIES[t.category].label}
                      </span>
                      <span className="text-muted-foreground">{t.timeLabel}</span>
                      {t.overdue && <span className="text-red-600">Overdue</span>}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-muted-foreground">
                        {t.assignees.map((a) => a.name.split(" ")[0]).join(", ")}
                      </span>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {STATUSES[t.status]}
                      </Badge>
                    </div>
                  </button>
                ))}
                {dayTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground lg:hidden">Nothing scheduled</p>
                )}
              </div>
            </div>
          );
        })}
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
          defaultDue={defaultDue}
          users={users}
        />
      )}
    </div>
  );
}