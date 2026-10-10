import type { HttpClient } from "@/shared/api";
import {
  type ApiTask,
  toApiCreateTask,
  toApiUpdateTask,
  toUiTask,
} from "@/features/tasks/api/mappers";
import type { NewTask, TaskPatch, TaskRepository } from "./TaskRepository";

/** Account mode: tasks are stored by the TODOS backend. */
export class ApiTaskRepository implements TaskRepository {
  constructor(private readonly http: HttpClient) {}

  async list() {
    const data = await this.http.get<ApiTask[]>("/api/tasks");
    return data.map(toUiTask);
  }

  async create(input: NewTask) {
    const created = await this.http.post<ApiTask>("/api/tasks", toApiCreateTask(input));
    // The API has no labels field yet; keep them for the current session.
    return { ...toUiTask(created), labels: input.labels };
  }

  async update(id: string, patch: TaskPatch) {
    const updated = await this.http.put<ApiTask>(
      `/api/tasks/${encodeURIComponent(id)}`,
      toApiUpdateTask(patch),
    );
    return toUiTask(updated);
  }

  async remove(id: string) {
    await this.http.delete(`/api/tasks/${encodeURIComponent(id)}`);
  }

  async reorder() {
    // The backend does not store a manual order yet.
  }
}
