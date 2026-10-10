import { http, type HttpClient } from "@/shared/api";

export type AuthUser = { id: string; email: string };
export type AuthResponse = { token: string; user: AuthUser };

export function createAuthApi(client: HttpClient) {
  return {
    register: (email: string, password: string) =>
      client.post<AuthResponse>("/api/auth/register", { email, password }),
    login: (email: string, password: string) =>
      client.post<AuthResponse>("/api/auth/login", { email, password }),
    me: () => client.get<{ user: AuthUser }>("/api/auth/me"),
    /** Permanently deletes the signed-in account; the password must be re-entered. */
    deleteAccount: (password: string) => client.delete("/api/auth/me", { password }),
  };
}

export const authApi = createAuthApi(http);
