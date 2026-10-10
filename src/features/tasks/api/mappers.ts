import type { Label, Priority, Task } from "@/features/tasks/model/types";

/** A task as the backend sends it (see server/src/http/presenters.ts). */
export type ApiTask = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  labels?: Label[];
  completed?: boolean;
  position?: number;
};

export function toUiTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    text: apiTask.title,
    description: apiTask.description ?? "",
    deadline: apiTask.dueDate ?? null,
    priority: apiTask.priority ?? "low",
    completed: !!apiTask.completed,
    labels: apiTask.labels ?? [],
  };
}

export function toApiCreateTask(draft: Partial<Task>) {
  return {
    title: draft.text,
    description: draft.description ?? "",
    dueDate: draft.deadline ?? null,
    priority: draft.priority ?? "low",
    labels: draft.labels ?? [],
  };
}

export function toApiUpdateTask(patch: Partial<Task>) {
  return {
    ...(patch.text !== undefined ? { title: patch.text } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.deadline !== undefined ? { dueDate: patch.deadline } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.labels !== undefined ? { labels: patch.labels } : {}),
    ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
  };
}
