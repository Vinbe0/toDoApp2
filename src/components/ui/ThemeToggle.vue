<script setup lang="ts">
import { useTheme } from "@/composables/useTheme";

const { isDark, toggleTheme } = useTheme();
</script>

<template>
  <button
    type="button"
    class="grid size-9 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="isDark ? 'Light theme' : 'Dark theme'"
    @click="toggleTheme"
  >
    <i :class="['pi', isDark ? 'pi-sun' : 'pi-moon']" aria-hidden="true" />
  </button>
</template>
