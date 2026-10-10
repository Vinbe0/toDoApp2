import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../domain/errors.js";
import type { TaskRepository } from "../domain/repositories.js";
import { ALLOWED_LABELS, type Label, type Priority, type Task } from "../domain/task.js";

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  label?: Label;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: string | null;
  priority?: Priority;
  label?: Label;
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
    return tasks.filter((task) => task.label === label);
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
      label: input.label ?? "work",
      completed: false,
      position: TaskService.incrementPosition(lastPosition),
      userId,
    });
  }

  async updateTask(_userId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) throw new NotFoundError("Task", taskId);
    if (input.title !== undefined && !input.title.trim()) {
      throw new ValidationError("Task title cannot be empty");
    }
    if (input.label !== undefined && !ALLOWED_LABELS.includes(input.label)) {
      throw new ValidationError('Invalid label. Expected "work", "shopping", or "university".');
    }

    // TODO: check that the task belongs to the user (see next commit).
    const updated = await this.taskRepository.updateTask(taskId, input);
    return updated!;
  }

  async deleteTask(_userId: string, taskId: string): Promise<void> {
    const task = await this.taskRepository.getTaskById(taskId);
    if (!task) throw new NotFoundError("Task", taskId);

    await this.taskRepository.deleteTask(taskId);
  }

  /** "a0" → "a1", "a9" → "b0": appends to the end without renumbering. */
  private static incrementPosition(pos: string): string {
    const letter = pos[0] ?? "a";
    const num = parseInt(pos.slice(1), 10);
    if (num < 9) return `${letter}${num + 1}`;
    return `${String.fromCharCode(letter.charCodeAt(0) + 1)}0`;
  }
}
