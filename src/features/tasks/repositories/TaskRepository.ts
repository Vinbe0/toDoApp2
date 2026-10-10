import type { Task } from "@/features/tasks/model/types";

/** New tasks start open unless `completed` says otherwise (e.g. when importing). */
export type NewTask = Omit<Task, "id" | "completed"> & { completed?: boolean };
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
