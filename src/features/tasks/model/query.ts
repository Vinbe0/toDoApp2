import type { Label, Priority, Task } from "./types";

export type StatusFilter = "all" | "active" | "completed";
export type SortOrder = "manual" | "deadline" | "priority";

/** Every way the task list can be narrowed down. All filters combine. */
export type TaskQuery = {
  status: StatusFilter;
  sort: SortOrder;
  search: string;
  labels: Label[];
  /** true: a task needs every selected label; false: any of them. */
  matchAllLabels: boolean;
};

export const createDefaultQuery = (): TaskQuery => ({
  status: "all",
  sort: "manual",
  search: "",
  labels: [],
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

  if (query.labels.length) {
    const hasLabel = (label: Label) => task.labels.includes(label);
    const ok = query.matchAllLabels ? query.labels.every(hasLabel) : query.labels.some(hasLabel);
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
  return query.status !== "all" || query.search.trim() !== "" || query.labels.length > 0;
}

export function countTasks(tasks: readonly Task[]) {
  const completed = tasks.filter((task) => task.completed).length;
  return { all: tasks.length, active: tasks.length - completed, completed };
}

/** Open (not completed) tasks per label. */
export function countOpenByLabel(tasks: readonly Task[], labels: readonly Label[]) {
  const counts = Object.fromEntries(labels.map((label) => [label, 0])) as Record<Label, number>;
  for (const task of tasks) {
    if (task.completed) continue;
    for (const label of task.labels) if (label in counts) counts[label] += 1;
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
