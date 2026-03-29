const API_BASE = import.meta.env.VITE_API_URL;

export type Task = {
  id: string;
  text: string;
  description: string;
  deadline: string | null;
  priority: string;
  completed: boolean;
  labels: string[];
};

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

async function del<T>(path: string): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

export const tasksApi = {
  getTasks: () => get<Task[]>("/api/tasks"),
  createTask: ( draft: unknown ) => post<Task>("/api/tasks", draft),
  updateTask: (id: string, patch: unknown) => put<Task>(`/api/tasks/${id}`, patch),
  deleteTask: (id: string) => del<void>(`/api/tasks/${id}`)
};
