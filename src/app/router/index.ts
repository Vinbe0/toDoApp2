import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { resolveAuthRedirect } from "./guards";

declare module "vue-router" {
  interface RouteMeta {
    title?: string;
    /** Hide the header and footer (full-screen auth pages). */
    bare?: boolean;
    /** App screens (not marketing pages): no footer. */
    app?: boolean;
    requiresAuth?: boolean;
    guestOnly?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomePage },
    {
      path: "/todo",
      name: "tasks",
      component: () => import("@/pages/TasksPage.vue"),
      meta: { title: "My tasks", app: true },
    },
    {
      path: "/account",
      name: "account",
      component: () => import("@/pages/AccountPage.vue"),
      meta: { title: "Account", requiresAuth: true },
    },
    {
      path: "/privacy",
      name: "privacy",
      component: () => import("@/pages/PrivacyPage.vue"),
      meta: { title: "Privacy policy" },
    },
    {
      path: "/first",
      name: "welcome",
      component: () => import("@/pages/WelcomePage.vue"),
      meta: { title: "Welcome", bare: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/pages/LoginPage.vue"),
      meta: { title: "Log in", bare: true, guestOnly: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/pages/RegisterPage.vue"),
      meta: { title: "Sign up", bare: true, guestOnly: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/pages/NotFoundPage.vue"),
      meta: { title: "Page not found" },
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

router.beforeEach((to) => resolveAuthRedirect(to, useAuthStore().isAuthenticated));

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · TODOS` : "TODOS — Task Planner";
});

export default router;
