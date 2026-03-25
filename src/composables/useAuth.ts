import { computed, ref } from "vue";
import { authApi, type AuthUser } from "@/api/authApi";

const token = ref<string | null>(localStorage.getItem("token"));
const user = ref<AuthUser | null>(
  JSON.parse(localStorage.getItem("auth_user") || "null"),
);

function setSession(newToken: string, newUser: AuthUser) {
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

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setSession(res.token, res.user);
  };

  const register = async (email: string, password: string) => {
    const res = await authApi.register(email, password);
    setSession(res.token, res.user);
  };

  const logout = () => clearSession();

  return { token, user, isAuthenticated, login, register, logout };
}
