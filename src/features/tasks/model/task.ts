import type { Priority, Task } from "./types";

export const PRIORITIES: readonly Priority[] = ["high", "medium", "low"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/** Turns untrusted data (e.g. from localStorage) into a valid Task, filling in defaults. */
export function normalizeTask(data: unknown): Task | null {
  if (!isRecord(data) || typeof data.text !== "string") return null;

  return {
    id: typeof data.id === "string" ? data.id : crypto.randomUUID(),
    text: data.text,
    description: typeof data.description === "string" ? data.description : "",
    completed: Boolean(data.completed),
    deadline: typeof data.deadline === "string" ? data.deadline : null,
    priority: PRIORITIES.includes(data.priority as Priority)
      ? (data.priority as Priority)
      : "medium",
    // Older versions stored fixed tag names under `labels`; those names are
    // the ids of the default guest labels, so they carry over as label ids.
    labelIds: toStringList(data.labelIds ?? data.labels),
  };
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function normalizeTaskList(data: unknown): Task[] | null {
  if (!Array.isArray(data)) return null;
  return data.map(normalizeTask).filter((task): task is Task => task !== null);
}
