import type { Category, PriorityKey, Status } from "./task-constants";

export type TaskView = {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  status: Status;
  priority: PriorityKey;
  fileLink: string | null;
  dayKey: string;
  dueInput: string;
  timeLabel: string;
  dueLabel: string;
  overdue: boolean;
  assignees: { id: string; name: string }[];
};

export type PickerUser = { id: string; name: string; openTasks: number };

export type CommentView = {
  id: string;
  text: string;
  author: string;
  time: string;
};
