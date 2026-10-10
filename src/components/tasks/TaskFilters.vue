<script setup lang="ts">
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseCard from "@/components/ui/BaseCard.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import LabelChip from "@/components/tasks/LabelChip.vue";
import { labelName } from "@/components/tasks/taskDisplay";
import type { FilterMode, Label } from "@/types/todo";

defineProps<{
  labels: Label[];
  selectedLabels: Label[];
  counts: { all: number; active: number; completed: number };
}>();

const emit = defineEmits<{
  search: [];
  toggleLabel: [label: Label];
  clearCompleted: [];
}>();

const filter = defineModel<FilterMode>("filter", { required: true });
const search = defineModel<string>("search", { required: true });
const strictLabels = defineModel<boolean>("strictLabels", { required: true });

const views: Array<{
  value: FilterMode;
  label: string;
  icon: string;
  count?: "all" | "active" | "completed";
}> = [
  { value: "all", label: "All tasks", icon: "pi-inbox", count: "all" },
  { value: "active", label: "Active", icon: "pi-circle", count: "active" },
  { value: "completed", label: "Completed", icon: "pi-check-circle", count: "completed" },
  { value: "byDate", label: "By deadline", icon: "pi-calendar" },
  { value: "byPriority", label: "By priority", icon: "pi-flag" },
  { value: "byLabel", label: "By labels", icon: "pi-tags" },
];
</script>

<template>
  <BaseCard as="aside" class="grid min-w-0 gap-4 lg:sticky lg:top-20 lg:gap-5">
    <BaseInput
      v-model="search"
      type="search"
      aria-label="Search tasks by title"
      placeholder="Search tasks…"
      @input="emit('search')"
    >
      <template #trailing>
        <i class="pi pi-search px-2 text-sm text-fg-subtle" aria-hidden="true" />
      </template>
    </BaseInput>

    <nav
      aria-label="Task views"
      class="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:gap-0.5 lg:overflow-visible lg:p-0"
    >
      <button
        v-for="view in views"
        :key="view.value"
        type="button"
        class="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors lg:gap-3"
        :class="
          filter === view.value
            ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
            : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
        "
        :aria-current="filter === view.value ? 'true' : undefined"
        @click="filter = view.value"
      >
        <i :class="['pi', view.icon, 'text-sm']" aria-hidden="true" />
        <span class="lg:flex-1">{{ view.label }}</span>
        <span v-if="view.count" class="text-xs text-fg-subtle">{{ counts[view.count] }}</span>
      </button>
    </nav>

    <div v-if="filter === 'byLabel'" class="grid gap-3 border-t border-border pt-4">
      <div class="flex flex-wrap gap-1.5">
        <LabelChip
          v-for="label in labels"
          :key="label"
          :selected="selectedLabels.includes(label)"
          @toggle="emit('toggleLabel', label)"
        >
          {{ labelName(label) }}
        </LabelChip>
      </div>
      <label class="flex items-center gap-2 text-sm text-fg-muted">
        <input v-model="strictLabels" type="checkbox" class="size-4 accent-brand-600" />
        Must match all labels
      </label>
    </div>

    <BaseButton
      variant="ghost"
      size="sm"
      class="justify-self-start text-red-600 lg:justify-self-stretch lg:justify-start hover:!bg-red-500/10 hover:!text-red-600"
      @click="emit('clearCompleted')"
    >
      <i class="pi pi-trash" aria-hidden="true" /> Clear completed
    </BaseButton>
  </BaseCard>
</template>
