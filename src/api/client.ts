const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ApiError(err.message || `HTTP ${res.status}`, res.status);
  }
  if (res.status === 204) return null as T;
  return res.json();
}

export const http = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, body: unknown) =>
    api<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    api<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => api<void>(path, { method: "DELETE" }),
};
