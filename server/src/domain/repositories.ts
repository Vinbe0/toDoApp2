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
}

export interface UserRepository {
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(userData: UserProps): Promise<User>;
}
