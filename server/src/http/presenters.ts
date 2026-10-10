import type { Label } from "../domain/label.js";
import type { Task } from "../domain/task.js";

/** The task shape sent to clients. Internal fields like the owner id stay private. */
export function toTaskResponse(task: Task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    priority: task.priority,
    labels: task.labels,
    completed: task.completed,
    position: task.position,
  };
}

export function toLabelResponse(label: Label) {
  return { id: label.id, name: label.name, color: label.color };
}
