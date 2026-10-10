import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { authApi } from "@/features/auth/api/authApi";
import { useAuthStore } from "../authStore";

vi.mock("@/features/auth/api/authApi", () => ({
  authApi: { login: vi.fn(), register: vi.fn() },
}));

const session = { token: "jwt-token", user: { id: "u1", email: "me@example.com" } };

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.register).mockReset();
    setActivePinia(createPinia());
  });

  it("starts as a guest", () => {
    const auth = useAuthStore();
    expect(auth.isGuest).toBe(true);
    expect(auth.isRegistered).toBe(false);
  });

  it("logs in and persists the session", async () => {
    vi.mocked(authApi.login).mockResolvedValue(session);
    const auth = useAuthStore();

    await auth.login("me@example.com", "secret");

    expect(authApi.login).toHaveBeenCalledWith("me@example.com", "secret");
    expect(auth.isRegistered).toBe(true);
    expect(auth.user).toEqual(session.user);
    expect(localStorage.getItem("token")).toBe("jwt-token");
  });

  it("registers and logs in", async () => {
    vi.mocked(authApi.register).mockResolvedValue(session);
    const auth = useAuthStore();

    await auth.register("me@example.com", "secret");
    expect(auth.isRegistered).toBe(true);
  });

  it("keeps the guest state when login fails", async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error("Invalid credentials"));
    const auth = useAuthStore();

    await expect(auth.login("me@example.com", "wrong")).rejects.toThrow("Invalid credentials");
    expect(auth.isGuest).toBe(true);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("restores a saved session", () => {
    localStorage.setItem("token", "saved");
    localStorage.setItem("auth_user", JSON.stringify(session.user));

    const auth = useAuthStore();
    expect(auth.isRegistered).toBe(true);
    expect(auth.user?.email).toBe("me@example.com");
  });

  it("logs out and clears the saved session", async () => {
    vi.mocked(authApi.login).mockResolvedValue(session);
    const auth = useAuthStore();
    await auth.login("me@example.com", "secret");

    auth.logout();
    expect(auth.isGuest).toBe(true);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("app_mode")).toBe("guest");
  });
});
