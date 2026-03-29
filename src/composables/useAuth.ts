import { computed, ref } from "vue";
import { authApi, type AuthUser } from "@/api/authApi";

type AppMode = "guest" | "registered";
const MODE_KEY = "app_mode";

const token = ref<string | null>(localStorage.getItem("token"));
const user = ref<AuthUser | null>(
  JSON.parse(localStorage.getItem("auth_user") || "null"),
);
const mode = ref<AppMode>(token.value ? "registered" : ((localStorage.getItem(MODE_KEY) as AppMode) || "guest")
);

function setMode(next: AppMode) {
  mode.value = next;
  localStorage.setItem(MODE_KEY, next)
}

function setSession(newToken: string, newUser: AuthUser) {
  setMode("registered")
  token.value = newToken;
  user.value = newUser;
  localStorage.setItem("token", newToken);
  localStorage.setItem("auth_user", JSON.stringify(newUser));
}

function clearSession() {
  token.value = null;
  user.value = null;
  localStorage.removeItem("token");
  localStorage.removeItem("auth_user");
}

export function enterGuestMode() {
  clearSession();
  setMode("guest")
}

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);
  const isGuest = computed(() => mode.value === "guest");
  const isRegistered = computed(() => mode.value === "registered" && !!token.value)


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
