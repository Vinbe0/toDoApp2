<script setup lang="ts">
import { RouterLink } from "vue-router";
import AppLogo from "@/components/ui/AppLogo.vue";

defineProps<{ title: string; subtitle?: string }>();
</script>

<template>
  <div class="grid min-h-screen bg-bg lg:grid-cols-2">
    <aside
      class="relative hidden overflow-hidden bg-brand-700 p-12 text-white lg:flex lg:flex-col lg:justify-between"
    >
      <div
        class="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-brand-400/30 blur-3xl"
        aria-hidden="true"
      />
      <RouterLink to="/" class="relative" aria-label="TODOS home">
        <AppLogo />
      </RouterLink>
      <div class="relative max-w-md">
        <p class="text-3xl leading-snug font-bold">
          “The secret of getting ahead is getting started.”
        </p>
        <p class="mt-3 text-brand-100">— Mark Twain</p>
      </div>
      <p class="relative text-sm text-brand-100">Priorities, deadlines and labels in one simple list.</p>
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
