import { computed, ref } from "vue";
import { authApi, type AuthUser } from "@/features/auth/api/authApi";
import { persistedSession, type AppMode } from "@/features/auth/model/session";
import { http } from "@/shared/api";

const token = ref<string | null>(persistedSession.token.get());
const user = ref<AuthUser | null>(persistedSession.user.get());
const mode = ref<AppMode>(token.value ? "registered" : (persistedSession.mode.get() ?? "guest"));

http.setTokenProvider(() => token.value);

function setMode(next: AppMode) {
  mode.value = next;
  persistedSession.mode.set(next);
}

function setSession(newToken: string, newUser: AuthUser) {
  setMode("registered");
  token.value = newToken;
  user.value = newUser;
  persistedSession.token.set(newToken);
  persistedSession.user.set(newUser);
}

function clearSession() {
  token.value = null;
  user.value = null;
  persistedSession.token.remove();
  persistedSession.user.remove();
}

export function enterGuestMode() {
  clearSession();
  setMode("guest");
}

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);
  const isGuest = computed(() => mode.value === "guest");
  const isRegistered = computed(() => mode.value === "registered" && !!token.value);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setSession(res.token, res.user);
  };

  const register = async (email: string, password: string) => {
    const res = await authApi.register(email, password);
    setSession(res.token, res.user);
  };

  const logout = () => enterGuestMode();

  return { token, user, isAuthenticated, isGuest, isRegistered, login, register, logout };
}
