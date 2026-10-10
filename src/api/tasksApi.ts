import { http } from "@/api/client";
import {
  type ApiTask,
  toApiCreateTask,
  toApiUpdateTask,
  toUiTask,
} from "@/api/mappers";
import type { Task } from "@/types/todo";

export const tasksApi = {
  async getTasks() {
    const data = await http.get<ApiTask[]>("/api/tasks");
    return data.map(toUiTask);
  },
  async createTask(draft: Partial<Task>) {
    const created = await http.post<ApiTask>("/api/tasks", toApiCreateTask(draft));
    return toUiTask(created);
  },
  async updateTask(id: string, patch: Partial<Task>) {
    const updated = await http.put<ApiTask>(`/api/tasks/${id}`, toApiUpdateTask(patch));
    return toUiTask(updated);
  },
  deleteTask: (id: string) => http.delete(`/api/tasks/${id}`),
};
