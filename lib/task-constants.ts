export const CATEGORIES = {
  SHOOT: { label: "Shoot", color: "bg-blue-100 text-blue-800" },
  EDITING: { label: "Editing", color: "bg-purple-100 text-purple-800" },
  POSTING: { label: "Posting", color: "bg-green-100 text-green-800" },
  SOCIAL: { label: "Social media", color: "bg-pink-100 text-pink-800" },
} as const;

export const STATUSES = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  IN_REVIEW: "In review",
  DONE: "Done",
} as const;

export const PRIORITIES = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
} as const;

export type Category = keyof typeof CATEGORIES;
export type Status = keyof typeof STATUSES;
export type PriorityKey = keyof typeof PRIORITIES;
