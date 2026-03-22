<script setup>
    import logo from '@/assets/bp.png';
    import { RouterLink } from 'vue-router'
</script>

<template>
    <nav class="bg-green-700 border-b border-green-500">
      <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div class="flex h-20 items-center justify-between">
          <div
            class="flex flex-1 items-center justify-center md:items-stretch md:justify-start gap-1"
          >
            <RouterLink class="flex flex-shrink-0 items-center mr-4" to="index.html">
              <img class="h-10 w-auto" :src="logo" alt="Vue Jobs" />
              <span class="hidden md:block text-white text-2xl font-bold ml-2"
                >TODOS</span
              >
            </RouterLink>
              <div class="flex space-x-2 items-center md:ml-auto gap-1 items-end">
                <RouterLink
                  to="/"
                  class="text-white font-semibold hover:bg-gray-900 text-lg rounded-md px-3 py-2"
                  >Home</RouterLink
                >
                <RouterLink
                  to="/todo"
                  class="text-white font-semibold hover:bg-green-900 text-lg rounded-md px-3 py-2"
                  >Manage Tasks</RouterLink
                >
                <RouterLink
                  to="/privacy"
                  class="text-white font-semibold hover:bg-green-900 text-lg rounded-md px-3 py-2"
                  >Privacy policy</RouterLink
                >
                <RouterLink
                  to="add-job.html"
                  class="text-white font-semibold hover:bg-green-900 text-lg rounded-md px-3 py-2 items-end"
                  >Account</RouterLink
                >
              </div>
          </div>
        </div>
      </div>
    </nav>
</template>