import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../domain/errors.js";
import type { TaskRepository } from "../domain/repositories.js";
import { ALLOWED_LABELS, type Label, type Priority, type Task } from "../domain/task.js";

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  labels?: Label[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  labels?: Label[];
  completed?: boolean;
}

/** Task use cases: list, create, update and delete a user's tasks. */
export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async getAllTasks(userId: string, label?: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getAllTasks(userId);
    if (!label) return tasks;
    if (!ALLOWED_LABELS.includes(label as Label)) {
      throw new ValidationError(
        'Invalid label filter. Expected "work", "shopping", or "university".',
      );
    }
    return tasks.filter((task) => task.hasLabel(label as Label));
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    if (!input.title?.trim()) {
      throw new ValidationError("Task title cannot be empty");
    }

    // New tasks go to the end of the list.
    const existingTasks = await this.taskRepository.getAllTasks(userId);
    const position = Math.max(-1, ...existingTasks.map((task) => task.position)) + 1;

    return this.taskRepository.createTask({
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description ?? "",
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? "low",
      labels: input.labels ?? [],
      completed: false,
      position,
      userId,
    });
  }

  async updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
    await this.getOwnedTask(userId, taskId);
    if (input.title !== undefined && !input.title.trim()) {
      throw new ValidationError("Task title cannot be empty");
    }

    const updated = await this.taskRepository.updateTask(taskId, input);
    if (!updated) throw new NotFoundError("Task", taskId);
    return updated;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    await this.getOwnedTask(userId, taskId);
    await this.taskRepository.deleteTask(taskId);
  }

  /**
   * Saves a manual order. orderedIds may list only some of the user's tasks
   * (e.g. a filtered view): those go first in the given order, the rest keep
   * their relative order after them.
   */
  async reorderTasks(userId: string, orderedIds: string[]): Promise<Task[]> {
    if (new Set(orderedIds).size !== orderedIds.length) {
      throw new ValidationError("Task ids must be unique");
    }

    const tasks = await this.taskRepository.getAllTasks(userId);
    const owned = new Set(tasks.map((task) => task.id));
    const unknown = orderedIds.find((id) => !owned.has(id));
    if (unknown) throw new NotFoundError("Task", unknown);

    const listed = new Set(orderedIds);
    const rest = tasks.filter((task) => !listed.has(task.id)).map((task) => task.id);
    await this.taskRepository.reorderTasks(userId, [...orderedIds, ...rest]);
    return this.taskRepository.getAllTasks(userId);
  }

  /**
   * Loads a task only if it belongs to the user. Other users' tasks are
   * reported as not found, so their existence isn't revealed.
   */
  private async getOwnedTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task || !task.isOwnedBy(userId)) throw new NotFoundError("Task", taskId);
    return task;
  }
}
