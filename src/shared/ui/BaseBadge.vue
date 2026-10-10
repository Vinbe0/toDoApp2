<script setup lang="ts">
type Tone = "neutral" | "brand" | "red" | "amber" | "blue";

withDefaults(defineProps<{ tone?: Tone }>(), { tone: "neutral" });

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-fg-muted",
  brand: "bg-brand-500/15 text-brand-700 dark:text-brand-300",
  red: "bg-red-500/15 text-red-700 dark:text-red-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  blue: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
    :class="tones[tone]"
  >
    <slot />
  </span>
</template>
