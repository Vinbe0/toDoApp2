import { http } from "@/shared/api";

export type AuthUser = { id: string; email: string };
export type AuthResponse = { token: string; user: AuthUser };

export const authApi = {
  register: (email: string, password: string) =>
    http.post<AuthResponse>("/api/auth/register", { email, password }),
  login: (email: string, password: string) =>
    http.post<AuthResponse>("/api/auth/login", { email, password }),
  me: () => http.get<{ user: AuthUser }>("/api/auth/me"),
};
