import { describe, expect, it } from "vitest";
import { resolveAuthRedirect } from "../guards";

const route = (fullPath: string, meta = {}) => ({ fullPath, meta });

describe("resolveAuthRedirect", () => {
  it("lets anyone open public pages", () => {
    expect(resolveAuthRedirect(route("/"), false)).toBe(true);
    expect(resolveAuthRedirect(route("/"), true)).toBe(true);
  });

  it("sends guests to login and remembers where they were going", () => {
    expect(resolveAuthRedirect(route("/account?tab=1", { requiresAuth: true }), false)).toEqual({
      name: "login",
      query: { redirect: "/account?tab=1" },
    });
  });

  it("lets signed-in users open protected pages", () => {
    expect(resolveAuthRedirect(route("/account", { requiresAuth: true }), true)).toBe(true);
  });

  it("keeps signed-in users away from login and sign-up", () => {
    expect(resolveAuthRedirect(route("/login", { guestOnly: true }), true)).toEqual({
      name: "tasks",
    });
  });
});
