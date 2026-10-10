import type { Task } from "@/features/tasks/model/types";
import type { StorageItem } from "@/shared/lib/storage";
import type { NewTask, TaskPatch, TaskRepository } from "./TaskRepository";

/** Guest mode: tasks live in the browser's storage. */
export class LocalTaskRepository implements TaskRepository {
  constructor(
    private readonly storage: StorageItem<Task[]>,
    private readonly createId: () => string = () => crypto.randomUUID(),
  ) {}

  async list() {
    return this.read();
  }

  async create(input: NewTask) {
    const task: Task = { ...input, id: this.createId(), completed: input.completed ?? false };
    this.write([...this.read(), task]);
    return task;
  }

  async update(id: string, patch: TaskPatch) {
    const tasks = this.read();
    const index = tasks.findIndex((task) => task.id === id);
    const existing = tasks[index];
    if (!existing) throw new Error("Task not found");

    const updated = { ...existing, ...patch };
    tasks[index] = updated;
    this.write(tasks);
    return updated;
  }

  async remove(id: string) {
    this.write(this.read().filter((task) => task.id !== id));
  }

  async reorder(orderedIds: string[]) {
    const position = new Map(orderedIds.map((id, index) => [id, index]));
    const rank = (task: Task) => position.get(task.id) ?? Number.MAX_SAFE_INTEGER;
    this.write([...this.read()].sort((a, b) => rank(a) - rank(b)));
  }

  /** Removes all guest tasks (after they were imported into an account). */
  clear() {
    this.storage.remove();
  }

  private read() {
    return this.storage.get() ?? [];
  }

  private write(tasks: Task[]) {
    this.storage.set(tasks);
  }
}
