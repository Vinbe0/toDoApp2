import { createRouter, createWebHistory } from "vue-router";
import HomePage from "@/pages/HomePage.vue";
import PrivacyPage from "@/pages/PrivacyPage.vue";
import TasksPage from "@/pages/TasksPage.vue";
import WelcomePage from "@/pages/WelcomePage.vue";
import RegisterPage from "@/pages/RegisterPage.vue";
import LoginPage from "@/pages/LoginPage.vue";
import AccountPage from "@/pages/AccountPage.vue";
import NotFoundPage from "@/pages/NotFoundPage.vue";

declare module "vue-router" {
  interface RouteMeta {
    showNavbar?: boolean;
    requiresAuth?: boolean;
    guestOnly?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage,
      meta: { showNavbar: true },
    },
    {
      path: "/privacy",
      name: "privacy",
      component: PrivacyPage,
      meta: { showNavbar: true },
    },
    {
      path: "/todo",
      name: "todo",
      component: TasksPage,
      meta: { showNavbar: true },
    },
    {
      path: "/first",
      name: "first",
      component: WelcomePage,
      meta: { showNavbar: false },
    },
    {
      path: "/register",
      name: "register",
      component: RegisterPage,
      meta: { showNavbar: false, guestOnly: true },
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
      meta: { showNavbar: false, guestOnly: true },
    },
    {
      path: "/account",
      name: "account",
      component: AccountPage,
      meta: { showNavbar: true, requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: NotFoundPage,
      meta: { showNavbar: true },
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) return { name: "login" };
  if (to.meta.guestOnly && token) return { name: "account" };
  return true;
});

export default router;
