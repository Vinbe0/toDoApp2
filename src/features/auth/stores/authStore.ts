import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { authApi, type AuthUser } from "@/features/auth/api/authApi";
import { persistedSession, type AppMode } from "@/features/auth/model/session";
import { HttpError } from "@/shared/api";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(persistedSession.token.get());
  const user = ref<AuthUser | null>(persistedSession.user.get());
  const mode = ref<AppMode>(token.value ? "registered" : (persistedSession.mode.get() ?? "guest"));

  const isAuthenticated = computed(() => !!token.value);
  const isRegistered = computed(() => mode.value === "registered" && !!token.value);
  const isGuest = computed(() => !isRegistered.value);

  function setMode(next: AppMode) {
    mode.value = next;
    persistedSession.mode.set(next);
  }

  function setSession(newToken: string, newUser: AuthUser) {
    token.value = newToken;
    user.value = newUser;
    persistedSession.token.set(newToken);
    persistedSession.user.set(newUser);
    setMode("registered");
  }

  async function login(email: string, password: string) {
    const { token, user } = await authApi.login(email, password);
    setSession(token, user);
  }

  async function register(email: string, password: string) {
    const { token, user } = await authApi.register(email, password);
    setSession(token, user);
  }

  /**
   * Confirms a stored token with the server. An invalid or expired token
   * logs the user out; network errors keep the session (the user may be offline).
   */
  async function validateSession() {
    if (!token.value) return;
    try {
      const { user: current } = await authApi.me();
      user.value = current;
      persistedSession.user.set(current);
    } catch (error) {
      if (error instanceof HttpError && error.isUnauthorized) logout();
    }
  }

  /**
   * Deletes the account on the server, then ends the session. Throws (and
   * keeps the session) if the password is wrong or the request fails.
   */
  async function deleteAccount(password: string) {
    await authApi.deleteAccount(password);
    logout();
  }

  /** Ends the session and falls back to guest mode. */
  function logout() {
    token.value = null;
    user.value = null;
    persistedSession.token.remove();
    persistedSession.user.remove();
    setMode("guest");
  }

  return {
    token,
    user,
    mode,
    isAuthenticated,
    isRegistered,
    isGuest,
    login,
    register,
    logout,
    deleteAccount,
    validateSession,
  };
});
