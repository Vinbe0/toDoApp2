<script setup lang="ts">
import { RouterLink } from "vue-router";
import AppLogo from "@/shared/ui/AppLogo.vue";

defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <div class="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,26rem)_1fr]">
    <aside class="hidden border-r border-border bg-surface p-12 lg:flex lg:flex-col">
      <RouterLink to="/" aria-label="TODOS home">
        <AppLogo />
      </RouterLink>

      <div class="my-auto max-w-sm">
        <p class="text-sm font-semibold text-fg">With an account</p>
        <ul class="mt-4 divide-y divide-border border-y border-border text-sm text-fg-muted">
          <li class="py-3">Your tasks are stored on the server, not just in this browser.</li>
          <li class="py-3">Labels, deadlines and your manual order are kept as they are.</li>
          <li class="py-3">Tasks you made as a guest can be imported when you sign up.</li>
        </ul>
      </div>
    </aside>

    <div class="flex flex-col items-center justify-center px-4 py-12 sm:px-6">
      <RouterLink to="/" class="mb-8 lg:hidden" aria-label="TODOS home">
        <AppLogo />
      </RouterLink>
      <div class="w-full max-w-sm">
        <h1 class="text-2xl font-bold tracking-tight text-fg">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1 text-sm text-fg-muted">{{ subtitle }}</p>
        <div class="mt-8">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>
