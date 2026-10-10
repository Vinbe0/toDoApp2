import type { Label, Priority, Task } from "./types";

export type StatusFilter = "all" | "active" | "completed";
export type SortOrder = "manual" | "deadline" | "priority";

/** Every way the task list can be narrowed down. All filters combine. */
export type TaskQuery = {
  status: StatusFilter;
  sort: SortOrder;
  search: string;
  /** Selected label ids. */
  labelIds: string[];
  /** true: a task needs every selected label; false: any of them. */
  matchAllLabels: boolean;
};

export const createDefaultQuery = (): TaskQuery => ({
  status: "all",
  sort: "manual",
  search: "",
  labelIds: [],
  matchAllLabels: false,
});

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const deadlineTime = (task: Task) =>
  task.deadline ? Date.parse(task.deadline) : Number.POSITIVE_INFINITY;

export const byDeadline = (a: Task, b: Task) => {
  const diff = deadlineTime(a) - deadlineTime(b);
  return Number.isNaN(diff) ? 0 : diff;
};

export const byPriority = (a: Task, b: Task) =>
  PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];

export const byTitle = (a: Task, b: Task) => a.text.localeCompare(b.text);

const comparators: Record<Exclude<SortOrder, "manual">, Array<(a: Task, b: Task) => number>> = {
  deadline: [byDeadline, byPriority, byTitle],
  priority: [byPriority, byDeadline, byTitle],
};

export function matchesQuery(task: Task, query: TaskQuery): boolean {
  if (query.status === "active" && task.completed) return false;
  if (query.status === "completed" && !task.completed) return false;

  const search = query.search.trim().toLowerCase();
  if (search && !task.text.toLowerCase().includes(search)) return false;

  if (query.labelIds.length) {
    const hasLabel = (labelId: string) => task.labelIds.includes(labelId);
    const ok = query.matchAllLabels
      ? query.labelIds.every(hasLabel)
      : query.labelIds.some(hasLabel);
    if (!ok) return false;
  }

  return true;
}

/** Filters and sorts tasks. Never mutates the input. */
export function queryTasks(tasks: readonly Task[], query: TaskQuery): Task[] {
  const result = tasks.filter((task) => matchesQuery(task, query));
  if (query.sort === "manual") return result;

  const chain = comparators[query.sort];
  return result.sort((a, b) => {
    for (const compare of chain) {
      const diff = compare(a, b);
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

export function isQueryActive(query: TaskQuery) {
  return query.status !== "all" || query.search.trim() !== "" || query.labelIds.length > 0;
}

export function countTasks(tasks: readonly Task[]) {
  const completed = tasks.filter((task) => task.completed).length;
  return { all: tasks.length, active: tasks.length - completed, completed };
}

/** Open (not completed) tasks per label id. */
export function countOpenByLabel(tasks: readonly Task[], labels: readonly Label[]) {
  const counts: Record<string, number> = Object.fromEntries(labels.map((label) => [label.id, 0]));
  for (const task of tasks) {
    if (task.completed) continue;
    for (const id of task.labelIds) if (id in counts) counts[id]! += 1;
  }
  return counts;
}

/**
 * Applies a reorder of a visible subset back onto the full list:
 * hidden tasks keep their slots, visible ones take the new order.
 */
export function applyReorder(all: readonly Task[], reorderedVisible: readonly Task[]): Task[] {
  const visibleIds = new Set(reorderedVisible.map((task) => task.id));
  const queue = [...reorderedVisible];
  return all.map((task) => (visibleIds.has(task.id) ? (queue.shift() ?? task) : task));
}

export type DueGroupKey = "overdue" | "earlier" | "today" | "tomorrow" | "week" | "later" | "none";

export type DueGroup = { key: DueGroupKey; title: string; tasks: Task[] };

const DUE_GROUPS: Array<{ key: DueGroupKey; title: string }> = [
  { key: "overdue", title: "Overdue" },
  { key: "earlier", title: "Earlier" },
  { key: "today", title: "Today" },
  { key: "tomorrow", title: "Tomorrow" },
  { key: "week", title: "Next 7 days" },
  { key: "later", title: "Later" },
  { key: "none", title: "No date" },
];

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function dueGroupOf(task: Task, today: Date): DueGroupKey {
  if (!task.deadline) return "none";
  const [year, month, day] = task.deadline.slice(0, 10).split("-").map(Number);
  const due = new Date(year!, month! - 1, day!);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) return task.completed ? "earlier" : "overdue";
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 7) return "week";
  return "later";
}

/**
 * Splits tasks into date sections (Overdue, Today, Tomorrow, …), keeping
 * their order within each section and leaving out empty sections.
 */
export function groupByDue(tasks: readonly Task[], now = new Date()): DueGroup[] {
  const today = startOfDay(now);
  const buckets = new Map<DueGroupKey, Task[]>();
  for (const task of tasks) {
    const key = dueGroupOf(task, today);
    buckets.set(key, [...(buckets.get(key) ?? []), task]);
  }
  return DUE_GROUPS.filter(({ key }) => buckets.has(key)).map(({ key, title }) => ({
    key,
    title,
    tasks: buckets.get(key)!,
  }));
}
