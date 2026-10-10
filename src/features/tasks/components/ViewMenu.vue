<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { SortOrder } from "@/features/tasks/model/query";

defineProps<{ canReset: boolean }>();
const emit = defineEmits<{ reset: []; clearCompleted: [] }>();
const sort = defineModel<SortOrder>("sort", { required: true });

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const options: Array<{ value: SortOrder; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "deadline", label: "Deadline" },
  { value: "priority", label: "Priority" },
];

// Close when clicking outside or pressing Escape.
const onPointerDown = (event: PointerEvent) => {
  if (open.value && !root.value?.contains(event.target as Node)) open.value = false;
};
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") open.value = false;
};
onMounted(() => {
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  document.removeEventListener("keydown", onKeydown);
});

const run = (action: "reset" | "clearCompleted") => {
  open.value = false;
  if (action === "reset") emit("reset");
  else emit("clearCompleted");
};
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-fg-muted hover:bg-surface-muted hover:text-fg"
      :aria-expanded="open"
      aria-haspopup="true"
      @click="open = !open"
    >
      <i class="pi pi-sliders-h text-xs" aria-hidden="true" /> View
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-20 mt-1 w-64 rounded-xl border border-border bg-surface p-3 shadow-lg"
      role="dialog"
      aria-label="View options"
    >
      <p class="mb-2 text-xs font-semibold text-fg-subtle">Sort by</p>
      <div class="flex rounded-lg border border-border bg-surface-muted p-0.5">
        <button
          v-for="option in options"
          :key="option.value"
          type="button"
          class="flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
          :class="
            sort === option.value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg'
          "
          :aria-pressed="sort === option.value"
          @click="sort = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="mt-3 grid gap-0.5 border-t border-border pt-2">
        <button
          v-if="canReset"
          type="button"
          class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-fg-muted hover:bg-surface-muted hover:text-fg"
          @click="run('reset')"
        >
          <i class="pi pi-filter-slash text-xs" aria-hidden="true" /> Reset filters
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-500/10"
          @click="run('clearCompleted')"
        >
          <i class="pi pi-trash text-xs" aria-hidden="true" /> Clear completed
        </button>
      </div>
    </div>
  </div>
</template>
