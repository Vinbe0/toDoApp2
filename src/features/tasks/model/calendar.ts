import type { Task } from "./types";

/**
 * Calendar helpers. Days are local calendar dates written as "YYYY-MM-DD",
 * the same format task deadlines use, so they compare as plain strings.
 */
export type IsoDate = string;

export function toIsoDate(date: Date): IsoDate {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Midnight local time on that day. */
export function parseIsoDate(iso: IsoDate): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

export const todayIso = (now = new Date()): IsoDate => toIsoDate(now);

/** Adds calendar days (not 24h steps, so daylight-saving changes don't skip a day). */
export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** `count` consecutive days starting at `start`, e.g. a rolling week from today. */
export function daysFrom(start: IsoDate, count = 7): IsoDate[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

const dueDay = (task: Task): IsoDate | null => task.deadline?.slice(0, 10) ?? null;

/** Open tasks due on each of the given days, in their existing order. */
export function openTasksByDay(tasks: readonly Task[], days: readonly IsoDate[]) {
  const byDay: Record<IsoDate, Task[]> = Object.fromEntries(days.map((day) => [day, []]));
  for (const task of tasks) {
    const day = dueDay(task);
    if (!task.completed && day && day in byDay) byDay[day]!.push(task);
  }
  return byDay;
}

/** Open tasks whose deadline is before `today`. */
export function overdueTasks(tasks: readonly Task[], today: IsoDate): Task[] {
  return tasks.filter((task) => {
    const day = dueDay(task);
    return !task.completed && day !== null && day < today;
  });
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

/** "October 2026", or "September – October 2026" when the week spans two months. */
export function weekTitle(days: readonly IsoDate[]): string {
  const first = parseIsoDate(days[0]!);
  const last = parseIsoDate(days[days.length - 1]!);
  if (first.getMonth() === last.getMonth()) return MONTH_YEAR.format(first);
  const month = (date: Date) => date.toLocaleDateString("en-GB", { month: "long" });
  return first.getFullYear() === last.getFullYear()
    ? `${month(first)} – ${MONTH_YEAR.format(last)}`
    : `${MONTH_YEAR.format(first)} – ${MONTH_YEAR.format(last)}`;
}
