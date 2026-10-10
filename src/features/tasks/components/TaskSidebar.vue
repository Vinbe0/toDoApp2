<script setup lang="ts">
import { computed } from "vue";
import { labelTextColor } from "@/features/tasks/components/taskDisplay";
import type { StatusFilter, TaskQuery } from "@/features/tasks/model/query";
import type { Label } from "@/features/tasks/model/types";

defineProps<{
  labels: readonly Label[];
  counts: Record<StatusFilter, number>;
  /** Open tasks per label id. */
  labelCounts: Record<string, number>;
  /** e.g. "Guest" or the account email. */
  accountName: string;
  accountHint: string;
}>();

const emit = defineEmits<{ addTask: [] }>();

const query = defineModel<TaskQuery>("query", { required: true });

const update = (patch: Partial<TaskQuery>) => {
  query.value = { ...query.value, ...patch };
};

const search = computed({
  get: () => query.value.search,
  set: (value: string) => update({ search: value }),
});

const toggleLabel = (labelId: string) => {
  const labelIds = query.value.labelIds.includes(labelId)
    ? query.value.labelIds.filter((id) => id !== labelId)
    : [...query.value.labelIds, labelId];
  update({ labelIds });
};

const views: Array<{ value: StatusFilter; label: string; icon: string }> = [
  { value: "all", label: "All tasks", icon: "pi-inbox" },
  { value: "active", label: "Active", icon: "pi-circle" },
  { value: "completed", label: "Completed", icon: "pi-check-circle" },
];

const item =
  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors";
const itemIdle = "text-fg-muted hover:bg-surface-muted hover:text-fg";
const itemActive = "bg-brand-500/10 font-medium text-brand-700 dark:text-brand-300";
</script>

<template>
  <nav class="flex flex-col gap-5 text-sm" aria-label="Task views">
    <div class="flex items-center gap-2.5 px-2">
      <span
        class="grid size-7 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white"
        aria-hidden="true"
      >
        {{ accountName.charAt(0).toUpperCase() }}
      </span>
      <div class="min-w-0">
        <p class="truncate font-medium text-fg">{{ accountName }}</p>
        <p class="truncate text-xs text-fg-subtle">{{ accountHint }}</p>
      </div>
    </div>

    <div class="grid gap-0.5">
      <button
        type="button"
        :class="[item, 'font-medium text-brand-700 hover:bg-surface-muted dark:text-brand-300']"
        @click="emit('addTask')"
      >
        <span class="grid size-5 place-items-center rounded-full bg-brand-600 text-white">
          <i class="pi pi-plus text-[10px]" aria-hidden="true" />
        </span>
        Add task
      </button>
      <label :class="[item, itemIdle, 'cursor-text']">
        <i class="pi pi-search w-5 text-center text-xs" aria-hidden="true" />
        <span class="sr-only">Search tasks by title</span>
        <input
          v-model="search"
          type="search"
          placeholder="Search"
          class="min-w-0 flex-1 bg-transparent text-fg placeholder:text-fg-muted focus:outline-none"
        />
      </label>
    </div>

    <div class="grid gap-0.5">
      <button
        v-for="view in views"
        :key="view.value"
        type="button"
        :class="[item, query.status === view.value ? itemActive : itemIdle]"
        :aria-pressed="query.status === view.value"
        @click="update({ status: view.value })"
      >
        <i :class="['pi', view.icon, 'w-5 text-center text-xs']" aria-hidden="true" />
        <span class="flex-1">{{ view.label }}</span>
        <span class="text-xs text-fg-subtle">{{ counts[view.value] }}</span>
      </button>
    </div>

    <div class="grid gap-0.5">
      <p class="px-2 pb-1 text-xs font-semibold text-fg-subtle">Labels</p>
      <button
        v-for="label in labels"
        :key="label.id"
        type="button"
        :class="[item, query.labelIds.includes(label.id) ? itemActive : itemIdle]"
        :aria-pressed="query.labelIds.includes(label.id)"
        @click="toggleLabel(label.id)"
      >
        <span
          :class="['w-5 text-center font-semibold', labelTextColor[label.color]]"
          aria-hidden="true"
          >#</span
        >
        <span class="min-w-0 flex-1 truncate">{{ label.name }}</span>
        <span class="text-xs text-fg-subtle">{{ labelCounts[label.id] ?? 0 }}</span>
      </button>
      <label
        v-if="query.labelIds.length > 1"
        class="mt-1 flex items-center gap-2 px-2 text-xs text-fg-muted"
      >
        <input
          type="checkbox"
          class="size-3.5 accent-brand-600"
          :checked="query.matchAllLabels"
          @change="update({ matchAllLabels: ($event.target as HTMLInputElement).checked })"
        />
        Must match all labels
      </label>
    </div>
  </nav>
</template>
