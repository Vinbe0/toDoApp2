import type { Priority, Task } from "@/types/todo";

export type ApiTask = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  completed?: boolean;
};

export function toUiTask(apiTask: ApiTask): Task {
  return {
    id: apiTask.id,
    text: apiTask.title,
    description: apiTask.description ?? "",
    deadline: apiTask.dueDate ?? null,
    priority: apiTask.priority ?? "low",
    completed: !!apiTask.completed,
    labels: [],
  };
}

export function toApiCreateTask(draft: Partial<Task>) {
  return {
    title: draft.text,
    description: draft.description ?? "",
    dueDate: draft.deadline ?? null,
    priority: draft.priority ?? "low",
  };
}

export function toApiUpdateTask(patch: Partial<Task>) {
  return {
    ...(patch.text !== undefined ? { title: patch.text } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.deadline !== undefined ? { dueDate: patch.deadline } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
  };
}
