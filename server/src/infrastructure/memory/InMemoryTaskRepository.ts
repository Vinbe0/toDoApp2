import type { TaskRepository } from "../../domain/repositories.js";
import { Task, type TaskProps } from "../../domain/task.js";

/** Keeps tasks in process memory. Data is lost on restart. */
export class InMemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, Task>();
  /** userId → task ids, so a user's tasks can be listed without a full scan. */
  private userTaskIndex = new Map<string, Set<string>>();

  async getAllTasks(userId: string): Promise<Task[]> {
    const taskIds = this.userTaskIndex.get(userId) ?? new Set<string>();
    return Array.from(taskIds)
      .map((id) => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined)
      .sort((a, b) => a.position - b.position);
  }

  async getTaskById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async createTask(taskData: TaskProps): Promise<Task> {
    const task = new Task(taskData);
    this.tasks.set(task.id, task);

    const ids = this.userTaskIndex.get(taskData.userId) ?? new Set<string>();
    ids.add(task.id);
    this.userTaskIndex.set(taskData.userId, ids);

    return task;
  }

  async updateTask(
    id: string,
    updatedData: Partial<Omit<TaskProps, "id" | "userId">>,
  ): Promise<Task | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    Object.assign(task, updatedData);
    return task;
  }

  async reorderTasks(userId: string, orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, position) => {
      const task = this.tasks.get(id);
      if (task?.isOwnedBy(userId)) task.position = position;
    });
  }

  async removeLabelFromTasks(labelId: string): Promise<void> {
    for (const task of this.tasks.values()) {
      task.labelIds = task.labelIds.filter((id) => id !== labelId);
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    const existed = this.tasks.delete(id);
    for (const taskIds of this.userTaskIndex.values()) {
      taskIds.delete(id);
    }
    return existed;
  }
}
