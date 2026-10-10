import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../domain/errors.js";
import type { LabelRepository, TaskRepository } from "../domain/repositories.js";
import type { Priority, Task } from "../domain/task.js";

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  labelIds?: string[];
  completed?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  labelIds?: string[];
  completed?: boolean;
}

/** Task use cases: list, create, update and delete a user's tasks. */
export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly labelRepository: LabelRepository,
  ) {}

  /** The user's tasks, optionally only those with a given label. */
  async getAllTasks(userId: string, labelId?: string): Promise<Task[]> {
    const tasks = await this.taskRepository.getAllTasks(userId);
    if (!labelId) return tasks;
    await this.assertOwnsLabels(userId, [labelId]);
    return tasks.filter((task) => task.hasLabel(labelId));
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    if (!input.title?.trim()) {
      throw new ValidationError("Task title cannot be empty");
    }

    await this.assertOwnsLabels(userId, input.labelIds ?? []);

    // New tasks go to the end of the list.
    const existingTasks = await this.taskRepository.getAllTasks(userId);
    const position = Math.max(-1, ...existingTasks.map((task) => task.position)) + 1;

    return this.taskRepository.createTask({
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description ?? "",
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? "low",
      labelIds: input.labelIds ?? [],
      completed: input.completed ?? false,
      position,
      userId,
    });
  }

  async updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
    await this.getOwnedTask(userId, taskId);
    if (input.title !== undefined && !input.title.trim()) {
      throw new ValidationError("Task title cannot be empty");
    }
    await this.assertOwnsLabels(userId, input.labelIds ?? []);

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

  /** Tasks may only use the user's own labels. */
  private async assertOwnsLabels(userId: string, labelIds: readonly string[]): Promise<void> {
    if (!labelIds.length) return;
    const owned = new Set((await this.labelRepository.listLabels(userId)).map((l) => l.id));
    const unknown = labelIds.find((id) => !owned.has(id));
    if (unknown) throw new ValidationError(`Unknown label "${unknown}"`);
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
