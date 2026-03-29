<template>
    <div class="min-h-[calc(100dvh-5rem)] w-full bg-gray-100 p-6 flex flex-col gap-4">
        <h1 class="text-3xl font-bold text-black text-center pb-3">Your account</h1>
        <div class="flex gap-2 bg-white rounded-2xl px-4 shadow-md">
        <img class="h-40 w-auto py-3" :src="accountToDo" />
        <div class="py-3">
            <p class="font-semibold text-lg">ID: {{ user?.id }}</p>
            <p class="font-semibold text-lg">Email: {{ user?.email }}</p>
        </div>
        </div>
        <button class="bg-green-700 hover:bg-green-800 text-white font-bold rounded-2xl w-52 h-8 text-xl"
        @click="submit"
        >Log Out</button>
    </div>
</template>

<script setup lang="ts">

const router = useRouter()
import accountToDo from '@/assets/accountToDo.jpg';
import { useAuth } from "@/composables/useAuth.ts";
import { useRouter } from "vue-router";

const { logout, user } = useAuth();
const submit = () => {
    logout()
    router.push("/login")
}
</script>