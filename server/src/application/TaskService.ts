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
  position?: string;
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

    const existingTasks = await this.taskRepository.getAllTasks(userId);
    const lastPosition = existingTasks.at(-1)?.position ?? "a0";

    return this.taskRepository.createTask({
      id: randomUUID(),
      title: input.title.trim(),
      description: input.description ?? "",
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? "low",
      labels: input.labels ?? [],
      completed: false,
      position: TaskService.incrementPosition(lastPosition),
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
   * Loads a task only if it belongs to the user. Other users' tasks are
   * reported as not found, so their existence isn't revealed.
   */
  private async getOwnedTask(userId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task || !task.isOwnedBy(userId)) throw new NotFoundError("Task", taskId);
    return task;
  }

  /** "a0" → "a1", "a9" → "b0": appends to the end without renumbering. */
  private static incrementPosition(pos: string): string {
    const letter = pos[0] ?? "a";
    const num = parseInt(pos.slice(1), 10);
    if (num < 9) return `${letter}${num + 1}`;
    return `${String.fromCharCode(letter.charCodeAt(0) + 1)}0`;
  }
}
