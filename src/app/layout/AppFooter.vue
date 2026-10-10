<script setup lang="ts">
import { RouterLink } from "vue-router";
import AppLogo from "@/shared/ui/AppLogo.vue";

const year = new Date().getFullYear();
</script>

<template>
  <footer class="border-t border-border bg-surface">
    <div
      class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-fg-muted sm:flex-row sm:px-6"
    >
      <AppLogo :size="24" class="text-fg" />
      <p>© {{ year }} TODOS. Built with Vue 3 and Tailwind CSS.</p>
      <RouterLink to="/privacy" class="hover:text-fg">Privacy</RouterLink>
    </div>
  </footer>
</template>
