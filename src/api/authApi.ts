const API_BASE = import.meta.env.VITE_API_URL;

export type AuthUser = { id: string; email: string };
export type AuthResponse = { token: string; user: AuthUser };

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

export const authApi = {
  register: (email: string, password: string) =>
    post<AuthResponse>("/api/auth/register", { email, password }),
  login: (email: string, password: string) =>
    post<AuthResponse>("/api/auth/login", { email, password }),
};
