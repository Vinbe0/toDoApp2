import { http } from "@/shared/api";
import { jsonItem } from "@/shared/lib/storage";
import { normalizeTaskList } from "@/features/tasks/model/task";
import { ApiTaskRepository } from "./ApiTaskRepository";
import { LocalTaskRepository } from "./LocalTaskRepository";

export type { NewTask, TaskPatch, TaskRepository } from "./TaskRepository";
export { ApiTaskRepository, LocalTaskRepository };

export const localTaskRepository = new LocalTaskRepository(
  jsonItem("guest-tasks", normalizeTaskList),
);
export const apiTaskRepository = new ApiTaskRepository(http);
