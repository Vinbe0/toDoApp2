import type { Label, LabelProps } from "./label.js";
import type { Task, TaskProps } from "./task.js";
import type { User, UserProps } from "./user.js";

/** Storage contracts. Services depend on these, never on a concrete database. */
export interface TaskRepository {
  getAllTasks(userId: string): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  createTask(taskData: TaskProps): Promise<Task>;
  updateTask(
    id: string,
    updatedData: Partial<Omit<TaskProps, "id" | "userId">>,
  ): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;
  /** Sets each task's position to its index in orderedIds (all owned by userId). */
  reorderTasks(userId: string, orderedIds: string[]): Promise<void>;
}

export interface UserRepository {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(userData: UserProps): Promise<User>;
}

export interface LabelRepository {
  /** A user's labels, oldest first. */
  listLabels(userId: string): Promise<Label[]>;
  getLabelById(id: string): Promise<Label | null>;
  /** Case-insensitive lookup by name within one user's labels. */
  findLabelByName(userId: string, name: string): Promise<Label | null>;
  createLabel(props: LabelProps): Promise<Label>;
  updateLabel(
    id: string,
    patch: Partial<Pick<LabelProps, "name" | "color">>,
  ): Promise<Label | null>;
  /** Deleting a label also removes it from every task. */
  deleteLabel(id: string): Promise<boolean>;
}
