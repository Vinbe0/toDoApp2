<script setup lang="ts">
import { computed } from "vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseCard from "@/shared/ui/BaseCard.vue";
import BaseInput from "@/shared/ui/BaseInput.vue";
import LabelChip from "@/features/tasks/components/LabelChip.vue";
import { labelName } from "@/features/tasks/components/taskDisplay";
import {
  isQueryActive,
  type SortOrder,
  type StatusFilter,
  type TaskQuery,
} from "@/features/tasks/model/query";
import type { Label } from "@/features/tasks/model/types";

defineProps<{
  labels: readonly Label[];
  counts: Record<StatusFilter, number>;
}>();

const emit = defineEmits<{ clearCompleted: []; reset: [] }>();

const query = defineModel<TaskQuery>("query", { required: true });

const update = (patch: Partial<TaskQuery>) => {
  query.value = { ...query.value, ...patch };
};

const search = computed({
  get: () => query.value.search,
  set: (value: string) => update({ search: value }),
});

const toggleLabel = (label: Label) => {
  const labels = query.value.labels.includes(label)
    ? query.value.labels.filter((item) => item !== label)
    : [...query.value.labels, label];
  update({ labels });
};

const statuses: Array<{ value: StatusFilter; label: string; icon: string }> = [
  { value: "all", label: "All tasks", icon: "pi-inbox" },
  { value: "active", label: "Active", icon: "pi-circle" },
  { value: "completed", label: "Completed", icon: "pi-check-circle" },
];

const sortOptions: Array<{ value: SortOrder; label: string }> = [
  { value: "manual", label: "Manual" },
  { value: "deadline", label: "Deadline" },
  { value: "priority", label: "Priority" },
];

const sectionTitle = "mb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase";
</script>

<template>
  <BaseCard as="aside" class="grid min-w-0 gap-5 lg:sticky lg:top-20">
    <BaseInput
      v-model="search"
      type="search"
      aria-label="Search tasks by title"
      placeholder="Search tasks…"
    >
      <template #trailing>
        <i class="pi pi-search px-2 text-sm text-fg-subtle" aria-hidden="true" />
      </template>
    </BaseInput>

    <nav aria-label="Filter by status">
      <div
        class="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:gap-0.5 lg:overflow-visible lg:p-0"
      >
        <button
          v-for="status in statuses"
          :key="status.value"
          type="button"
          class="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors lg:gap-3"
          :class="
            query.status === status.value
              ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
              : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
          "
          :aria-pressed="query.status === status.value"
          @click="update({ status: status.value })"
        >
          <i :class="['pi', status.icon, 'text-sm']" aria-hidden="true" />
          <span class="lg:flex-1">{{ status.label }}</span>
          <span class="text-xs text-fg-subtle">{{ counts[status.value] }}</span>
        </button>
      </div>
    </nav>

    <fieldset>
      <legend :class="sectionTitle">Sort by</legend>
      <div class="flex rounded-xl border border-border bg-surface-muted p-0.5">
        <button
          v-for="option in sortOptions"
          :key="option.value"
          type="button"
          class="flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors"
          :class="
            query.sort === option.value
              ? 'bg-surface text-fg shadow-sm'
              : 'text-fg-muted hover:text-fg'
          "
          :aria-pressed="query.sort === option.value"
          @click="update({ sort: option.value })"
        >
          {{ option.label }}
        </button>
      </div>
    </fieldset>

    <fieldset>
      <legend :class="sectionTitle">Labels</legend>
      <div class="flex flex-wrap gap-1.5">
        <LabelChip
          v-for="label in labels"
          :key="label"
          :selected="query.labels.includes(label)"
          @toggle="toggleLabel(label)"
        >
          {{ labelName(label) }}
        </LabelChip>
      </div>
      <label
        v-if="query.labels.length > 1"
        class="mt-3 flex items-center gap-2 text-sm text-fg-muted"
      >
        <input
          type="checkbox"
          class="size-4 accent-brand-600"
          :checked="query.matchAllLabels"
          @change="update({ matchAllLabels: ($event.target as HTMLInputElement).checked })"
        />
        Must match all labels
      </label>
    </fieldset>

    <div class="flex flex-wrap gap-2 border-t border-border pt-4">
      <BaseButton v-if="isQueryActive(query)" variant="secondary" size="sm" @click="emit('reset')">
        <i class="pi pi-filter-slash" aria-hidden="true" /> Reset filters
      </BaseButton>
      <BaseButton
        variant="ghost"
        size="sm"
        class="text-red-600 hover:!bg-red-500/10 hover:!text-red-600"
        @click="emit('clearCompleted')"
      >
        <i class="pi pi-trash" aria-hidden="true" /> Clear completed
      </BaseButton>
    </div>
  </BaseCard>
</template>
