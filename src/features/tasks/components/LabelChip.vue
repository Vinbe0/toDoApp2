<script setup lang="ts">
import { labelTextColor } from "@/features/tasks/components/taskDisplay";
import type { Label } from "@/features/tasks/model/types";

defineProps<{ label: Label; selected: boolean }>();
defineEmits<{ toggle: [] }>();
</script>

<template>
  <button
    type="button"
    class="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs transition-colors"
    :class="
      selected
        ? 'border-brand-500/40 bg-brand-500/10 text-fg'
        : 'border-border text-fg-muted hover:bg-surface-muted hover:text-fg'
    "
    :aria-pressed="selected"
    @click="$emit('toggle')"
  >
    <span :class="['font-semibold', labelTextColor[label.color]]" aria-hidden="true">#</span>
    {{ label.name }}
  </button>
</template>
