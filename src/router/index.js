import { createRouter, createWebHistory } from "vue-router";
import HomeView from '@/views/HomeView.vue'
import PrivacyView from '@/views/PrivacyView.vue'
import ToDoView from '@/views/ToDoView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/privacy',
            name: 'privacy',
            component: PrivacyView
        },
        {
            path: '/todo',
            name: 'todo',
            component: ToDoView
        }
    ]
})

export default router