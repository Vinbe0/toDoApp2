import { http } from "@/shared/api";
import { jsonItem } from "@/shared/lib/storage";
import { normalizeTaskList } from "@/features/tasks/model/task";
import { normalizeLabelList } from "@/features/tasks/model/label";
import { ApiLabelRepository } from "./ApiLabelRepository";
import { LocalLabelRepository } from "./LocalLabelRepository";
import { ApiTaskRepository } from "./ApiTaskRepository";
import { LocalTaskRepository } from "./LocalTaskRepository";

export type { NewTask, TaskPatch, TaskRepository } from "./TaskRepository";
export type { LabelPatch, LabelRepository, NewLabel } from "./LabelRepository";
export { ApiLabelRepository, ApiTaskRepository, LocalLabelRepository, LocalTaskRepository };

/** The two storage backends; the tasks store picks one based on auth state. */
export const taskRepositories = {
  local: new LocalTaskRepository(jsonItem("guest-tasks", normalizeTaskList)),
  api: new ApiTaskRepository(http),
};

/** Label storage, chosen the same way as task storage. */
export const labelRepositories = {
  local: new LocalLabelRepository(jsonItem("guest-labels", normalizeLabelList)),
  api: new ApiLabelRepository(http),
};
