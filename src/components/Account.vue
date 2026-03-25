<template>
    <div class="min-h-[calc(100dvh-5rem)] w-full bg-gray-100 p-6">
        <h1 class="text-3xl font-bold text-black text-center">Your account</h1>
        <div class="flex gap-2">
        <img class="h-40 w-auto py-3" :src="accountToDo" />
        <div class="py-3">
            <p class="font-semibold text-lg">ID:</p>
            <p class="font-semibold text-lg">Email:</p>
            <p class="font-semibold text-lg">Password:</p>
        </div>
        </div>
    </div>
</template>

<script setup>
import accountToDo from '@/assets/accountToDo.jpg'
</script>