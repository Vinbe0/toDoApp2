import type { Task } from "@/features/tasks/model/types";

export type NewTask = Omit<Task, "id" | "completed">;
export type TaskPatch = Partial<Omit<Task, "id">>;

/**
 * Where tasks are stored. The UI and store only talk to this interface,
 * so guest (browser) and account (server) storage are interchangeable.
 */
export interface TaskRepository {
  list(): Promise<Task[]>;
  create(input: NewTask): Promise<Task>;
  update(id: string, patch: TaskPatch): Promise<Task>;
  remove(id: string): Promise<void>;
  /** Persists a manual ordering of the given task ids. */
  reorder(orderedIds: string[]): Promise<void>;
}
