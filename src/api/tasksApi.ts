const API_BASE = import.meta.env.VITE_API_URL;
import { toApiCreateTask, toUiTask } from "@/api/mappers";

export type Task = {
  id: string;
  text: string;
  description: string;
  deadline: string | null;
  priority: "low" | "medium" | "high";
  completed: boolean;
  labels: string[];
};

type ApiTask = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  priority?: "low" | "medium" | "high";
  completed?: boolean;
};

const toApiUpdateTask = (patch: Partial<Task>) => ({
  ...(patch.text !== undefined ? { title: patch.text } : {}),
  ...(patch.description !== undefined ? { description: patch.description } : {}),
  ...(patch.deadline !== undefined ? { dueDate: patch.deadline } : {}),
  ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
  ...(patch.completed !== undefined ? { completed: patch.completed } : {}),
});

async function get<T>(path: string): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

async function del(path: string): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `HTTP ${res.status}`);
  }
}

export const tasksApi = {
  async getTasks() {
    const data = await get<ApiTask[]>("/api/tasks");
    return data.map(toUiTask);
  },
  async createTask(draft: Partial<Task>) {
    const created = await post<ApiTask>("/api/tasks", toApiCreateTask(draft));
    return toUiTask(created);
  },
  async updateTask(id: string, patch: Partial<Task>) {
    const updated = await put<ApiTask>(`/api/tasks/${id}`, toApiUpdateTask(patch));
    return toUiTask(updated);
  },
  deleteTask: (id: string) => del(`/api/tasks/${id}`),
};
