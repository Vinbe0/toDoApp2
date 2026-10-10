<script setup lang="ts">
defineProps<{ selected: boolean }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
    :class="
      selected
        ? 'border-brand-600 bg-brand-600 text-white'
        : 'border-border bg-surface text-fg-muted hover:border-brand-500 hover:text-fg'
    "
    :aria-pressed="selected"
    @click="$emit('toggle')"
  >
    <i v-if="selected" class="pi pi-check text-[10px]" aria-hidden="true" />
    <slot />
  </button>
</template>
