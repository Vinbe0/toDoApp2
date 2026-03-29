import { createRouter, createWebHistory } from "vue-router";
import HomeView from '@/views/HomeView.vue'
import PrivacyView from '@/views/PrivacyView.vue'
import ToDoView from '@/views/ToDoView.vue'
import WelcomeView from '@/views/WelcomeView.vue'
import RegisterView from '@/views/RegisterView.vue'
import LogInView from '@/views/LogInView.vue'
import AccountView from '@/views/AccountView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView,
            meta: { showNavbar: true }
        },
        {
            path: '/privacy',
            name: 'privacy',
            component: PrivacyView,
            meta: { showNavbar: true }
        },
        {
            path: '/todo',
            name: 'todo',
            component: ToDoView,
            meta: { showNavbar: true }
        },
        {
            path: '/first',
            name: 'first',
            component: WelcomeView,
            meta: { showNavbar: false }
        },
        {
            path: '/register',
            name: 'register',
            component: RegisterView,
            meta: { showNavbar: false }
        },
        {
            path: '/login',
            name: 'login',
            component: LogInView,
            meta: { showNavbar: false }
        },
        {
            path: '/account',
            name: 'account',
            component: AccountView,
            meta: { showNavbar: true, requiresAuth: true }
        }
    ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  if (to.meta.requiresAuth && !token) return "/login";
  return true;
})

export default router