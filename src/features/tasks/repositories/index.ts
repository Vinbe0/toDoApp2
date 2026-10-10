import { http } from "@/shared/api";
import { jsonItem } from "@/shared/lib/storage";
import { normalizeTaskList } from "@/features/tasks/model/task";
import { ApiTaskRepository } from "./ApiTaskRepository";
import { LocalTaskRepository } from "./LocalTaskRepository";

export type { NewTask, TaskPatch, TaskRepository } from "./TaskRepository";
export { ApiTaskRepository, LocalTaskRepository };

/** The two storage backends; the tasks store picks one based on auth state. */
export const taskRepositories = {
  local: new LocalTaskRepository(jsonItem("guest-tasks", normalizeTaskList)),
  api: new ApiTaskRepository(http),
};
