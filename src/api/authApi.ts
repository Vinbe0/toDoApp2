const API_BASE = import.meta.env.VITE_API_URL;

export type AuthUser = { id: string; email: string };
export type AuthResponse = { token: string; user: AuthUser}