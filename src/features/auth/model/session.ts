import { jsonItem, stringItem } from "@/shared/lib/storage";
import type { AuthUser } from "@/features/auth/api/authApi";

export type AppMode = "guest" | "registered";

const isAuthUser = (data: unknown): AuthUser | null =>
  typeof data === "object" &&
  data !== null &&
  typeof (data as AuthUser).id === "string" &&
  typeof (data as AuthUser).email === "string"
    ? (data as AuthUser)
    : null;

/** Persisted session pieces. Keys match earlier versions so users stay logged in. */
export const persistedSession = {
  token: stringItem("token"),
  user: jsonItem("auth_user", isAuthUser),
  mode: stringItem<AppMode>("app_mode", ["guest", "registered"]),
};
