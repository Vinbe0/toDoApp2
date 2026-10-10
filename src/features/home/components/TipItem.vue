<script setup lang="ts">
export type Tip = {
  id: string;
  category: string;
  title: string;
  description: string;
  meta: string;
};

defineProps<{ tip: Tip }>();
</script>

<template>
  <li class="grid gap-1 py-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6">
    <p class="text-sm text-fg-subtle">{{ tip.category }}</p>
    <div>
      <h3 class="font-semibold text-fg">{{ tip.title }}</h3>
      <p class="mt-1 text-sm leading-relaxed text-fg-muted">{{ tip.description }}</p>
      <p class="mt-2 text-xs text-fg-subtle">{{ tip.meta }}</p>
    </div>
  </li>
</template>
