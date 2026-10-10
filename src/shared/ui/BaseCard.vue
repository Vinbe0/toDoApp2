<script setup lang="ts">
withDefaults(defineProps<{ as?: string; padded?: boolean }>(), {
  as: "div",
  padded: true,
});
</script>

<template>
  <component
    :is="as"
    class="rounded-2xl border border-border bg-surface shadow-sm"
    :class="padded && 'p-5 sm:p-6'"
  >
    <slot />
  </component>
</template>
