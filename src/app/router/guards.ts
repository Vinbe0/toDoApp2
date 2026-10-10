import type { RouteLocationNormalized, RouteLocationRaw } from "vue-router";

/**
 * Decides whether a navigation may continue. Pure, so it can be tested
 * without a router: returns true to continue or a location to redirect to.
 */
export function resolveAuthRedirect(
  to: Pick<RouteLocationNormalized, "meta" | "fullPath">,
  isAuthenticated: boolean,
): true | RouteLocationRaw {
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && isAuthenticated) {
    return { name: "tasks" };
  }
  return true;
}
