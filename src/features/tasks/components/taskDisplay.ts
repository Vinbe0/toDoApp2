import { toIsoDate } from "@/features/tasks/model/calendar";
import type { LabelColor, Priority, Task } from "@/features/tasks/model/types";

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

/** Colour of the "#" before a label name. Full class names so Tailwind keeps them. */
export const labelTextColor: Record<LabelColor, string> = {
  red: "text-red-600 dark:text-red-400",
  orange: "text-orange-600 dark:text-orange-400",
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-green-600 dark:text-green-400",
  teal: "text-teal-600 dark:text-teal-400",
  sky: "text-sky-600 dark:text-sky-400",
  blue: "text-blue-600 dark:text-blue-400",
  violet: "text-violet-600 dark:text-violet-400",
  pink: "text-pink-600 dark:text-pink-400",
  slate: "text-slate-500 dark:text-slate-400",
};

/** Solid swatch for the colour picker. */
export const labelSwatch: Record<LabelColor, string> = {
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  green: "bg-green-500",
  teal: "bg-teal-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  pink: "bg-pink-500",
  slate: "bg-slate-500",
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
