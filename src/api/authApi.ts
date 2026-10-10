import { http } from "@/api/client";

export type AuthUser = { id: string; email: string };
export type AuthResponse = { token: string; user: AuthUser };

export const authApi = {
  register: (email: string, password: string) =>
    http.post<AuthResponse>("/api/auth/register", { email, password }),
  login: (email: string, password: string) =>
    http.post<AuthResponse>("/api/auth/login", { email, password }),
};
