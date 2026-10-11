import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { authApi } from "@/features/auth/api/authApi";
import { HttpError, NetworkError } from "@/shared/api";
import { useAuthStore } from "../authStore";

vi.mock("@/features/auth/api/authApi", () => ({
  authApi: { login: vi.fn(), register: vi.fn(), me: vi.fn(), deleteAccount: vi.fn() },
}));

const session = { token: "jwt-token", user: { id: "u1", email: "me@example.com" } };

describe("auth store", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(authApi.login).mockReset();
    vi.mocked(authApi.register).mockReset();
    vi.mocked(authApi.me).mockReset();
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

  describe("validateSession", () => {
    beforeEach(() => {
      localStorage.setItem("token", "saved");
      localStorage.setItem("auth_user", JSON.stringify(session.user));
    });

    it("refreshes the user from the server", async () => {
      vi.mocked(authApi.me).mockResolvedValue({ user: { id: "u1", email: "new@example.com" } });
      const auth = useAuthStore();
      await auth.validateSession();
      expect(auth.user?.email).toBe("new@example.com");
    });

    it("logs out when the server rejects the token", async () => {
      vi.mocked(authApi.me).mockRejectedValue(new HttpError("Expired", 401));
      const auth = useAuthStore();
      await auth.validateSession();
      expect(auth.isGuest).toBe(true);
    });

    it("keeps the session when the server can't be reached", async () => {
      vi.mocked(authApi.me).mockRejectedValue(new NetworkError("Offline"));
      const auth = useAuthStore();
      await auth.validateSession();
      expect(auth.isRegistered).toBe(true);
    });

    it("does nothing for guests", async () => {
      localStorage.clear();
      await useAuthStore().validateSession();
      expect(authApi.me).not.toHaveBeenCalled();
    });
  });

  describe("deleteAccount", () => {
    it("deletes on the server, then ends the session", async () => {
      vi.mocked(authApi.login).mockResolvedValue(session);
      vi.mocked(authApi.deleteAccount).mockResolvedValue(undefined);
      const auth = useAuthStore();
      await auth.login("me@example.com", "secret");

      await auth.deleteAccount("secret");

      expect(authApi.deleteAccount).toHaveBeenCalledWith("secret");
      expect(auth.isGuest).toBe(true);
      expect(localStorage.getItem("token")).toBeNull();
    });

    it("keeps the session when the password is wrong", async () => {
      vi.mocked(authApi.login).mockResolvedValue(session);
      vi.mocked(authApi.deleteAccount).mockRejectedValue(new HttpError("Incorrect password", 403));
      const auth = useAuthStore();
      await auth.login("me@example.com", "secret");

      await expect(auth.deleteAccount("wrong")).rejects.toMatchObject({ status: 403 });
      expect(auth.isRegistered).toBe(true);
    });
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
