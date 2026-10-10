<script setup lang="ts">
withDefaults(defineProps<{ showText?: boolean; size?: number }>(), {
  showText: true,
  size: 32,
});
</script>

<template>
  <span class="inline-flex items-center gap-2">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" class="fill-brand-600" />
      <path
        d="M9 16.5l4.5 4.5L23 11.5"
        stroke="white"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span v-if="showText" class="text-xl font-extrabold tracking-tight">TODOS</span>
  </span>
</template>
