import type { Label, Priority, Task } from "@/features/tasks/model/types";

export const priorityOptions: Array<{
  value: Priority;
  label: string;
  tone: "red" | "amber" | "blue";
}> = [
  { value: "high", label: "High", tone: "red" },
  { value: "medium", label: "Medium", tone: "amber" },
  { value: "low", label: "Low", tone: "blue" },
];

export const priorityLabel = (priority: Priority) =>
  priorityOptions.find((option) => option.value === priority)?.label ?? priority;

export const labelName = (label: Label) => label.charAt(0).toUpperCase() + label.slice(1);

const toIsoDate = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Colour of the "#" before each label, so labels are easy to tell apart. */
export const labelHashColor: Record<Label, string> = {
  work: "text-sky-600 dark:text-sky-400",
  shopping: "text-amber-600 dark:text-amber-400",
  university: "text-violet-600 dark:text-violet-400",
};

/** Checkbox ring (and fill when done) coloured by priority. */
export const priorityCheckbox: Record<Priority, string> = {
  high: "border-red-500 bg-red-500/10 text-red-600 data-[done=true]:bg-red-500",
  medium: "border-amber-500 bg-amber-500/10 text-amber-600 data-[done=true]:bg-amber-500",
  low: "border-sky-500 bg-sky-500/10 text-sky-600 data-[done=true]:bg-sky-500",
};

export type DueTone = "overdue" | "today" | "soon" | "later";

const DAY_MS = 86_400_000;
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Human-friendly due date relative to `now`: "Yesterday", "Today",
 * "Tomorrow", a weekday within the next week, otherwise "13 Oct"
 * (with the year if it isn't this year). Open overdue tasks get the "overdue" tone.
 */
export function describeDue(task: Task, now = new Date()): { text: string; tone: DueTone } | null {
  if (!task.deadline) return null;

  const due = new Date(task.deadline.slice(0, 10) + "T00:00:00");
  const today = new Date(toIsoDate(now) + "T00:00:00");
  const days = Math.round((due.getTime() - today.getTime()) / DAY_MS);

  let text: string;
  if (days === -1) text = "Yesterday";
  else if (days === 0) text = "Today";
  else if (days === 1) text = "Tomorrow";
  else if (days > 1 && days < 7) text = WEEKDAY.format(due);
  else if (due.getFullYear() === today.getFullYear()) text = DAY_MONTH.format(due);
  else text = DAY_MONTH_YEAR.format(due);

  const tone: DueTone =
    days < 0 && !task.completed ? "overdue" : days === 0 ? "today" : days < 7 ? "soon" : "later";
  return { text, tone };
}

export const dueToneClass: Record<DueTone, string> = {
  overdue: "text-red-600 dark:text-red-400",
  today: "text-brand-700 dark:text-brand-400",
  soon: "text-violet-600 dark:text-violet-400",
  later: "text-fg-subtle",
};
