<script setup lang="ts">
withDefaults(defineProps<{ tint?: "mint" | "cream" | "peach" }>(), { tint: "mint" });

const tints = {
  mint: "bg-tint-mint",
  cream: "bg-tint-cream",
  peach: "bg-tint-peach",
};
</script>

<template>
  <!-- Decorative: a non-interactive slice of the real UI on a soft backdrop. -->
  <div :class="['rounded-3xl p-5 sm:p-8', tints[tint]]" aria-hidden="true" inert>
    <div class="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <slot />
    </div>
  </div>
</template>
