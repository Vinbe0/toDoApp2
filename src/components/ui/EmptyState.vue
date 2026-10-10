<script setup lang="ts">
defineProps<{ icon?: string; title: string; description?: string }>();
</script>

<template>
  <div
    class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center"
  >
    <i v-if="icon" :class="['pi', icon, 'text-3xl text-fg-subtle']" aria-hidden="true" />
    <p class="font-semibold text-fg">{{ title }}</p>
    <p v-if="description" class="max-w-sm text-sm text-fg-muted">{{ description }}</p>
    <slot />
  </div>
</template>
