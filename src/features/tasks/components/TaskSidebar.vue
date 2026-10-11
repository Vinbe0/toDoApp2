<script setup lang="ts">
import { computed, ref } from "vue";
import LabelMenu from "@/features/tasks/components/LabelMenu.vue";
import LabelNameInput from "@/features/tasks/components/LabelNameInput.vue";
import { labelTextColor } from "@/features/tasks/components/taskDisplay";
import { nextLabelColor } from "@/features/tasks/model/label";
import type { StatusFilter, TaskQuery } from "@/features/tasks/model/query";
import type { Label, LabelColor } from "@/features/tasks/model/types";

/** Label management; when omitted (e.g. in previews) labels are read-only. */
export type LabelActions = {
  create: (name: string) => Promise<boolean>;
  rename: (id: string, name: string) => Promise<boolean>;
  recolor: (id: string, color: LabelColor) => Promise<boolean>;
  remove: (id: string) => Promise<void>;
};

const props = defineProps<{
  labels: readonly Label[];
  counts: Record<StatusFilter, number>;
  /** Open tasks per label id. */
  labelCounts: Record<string, number>;
  /** e.g. "Guest" or the account email. */
  accountName: string;
  accountHint: string;
  labelActions?: LabelActions;
  /** True while the Upcoming (week) view is shown instead of a list. */
  upcomingActive?: boolean;
  /** Open tasks with a deadline from today on. */
  upcomingCount?: number;
}>();

const emit = defineEmits<{ addTask: []; showList: []; showUpcoming: [] }>();

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

const adding = ref(false);
const renamingId = ref<string | null>(null);
const menuFor = ref<string | null>(null);

const openRename = (id: string) => {
  menuFor.value = null;
  renamingId.value = id;
};

const removeLabel = async (id: string) => {
  menuFor.value = null;
  await props.labelActions?.remove(id);
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
        :class="[item, !upcomingActive && query.status === view.value ? itemActive : itemIdle]"
        :aria-pressed="!upcomingActive && query.status === view.value"
        @click="
          update({ status: view.value });
          emit('showList');
        "
      >
        <i :class="['pi', view.icon, 'w-5 text-center text-xs']" aria-hidden="true" />
        <span class="flex-1">{{ view.label }}</span>
        <span class="text-xs text-fg-subtle">{{ counts[view.value] }}</span>
      </button>
      <button
        type="button"
        :class="[item, upcomingActive ? itemActive : itemIdle]"
        :aria-pressed="!!upcomingActive"
        @click="emit('showUpcoming')"
      >
        <i class="pi pi-calendar w-5 text-center text-xs" aria-hidden="true" />
        <span class="flex-1">Upcoming</span>
        <span v-if="upcomingCount !== undefined" class="text-xs text-fg-subtle">{{
          upcomingCount
        }}</span>
      </button>
    </div>

    <div class="grid gap-0.5">
      <div class="flex items-center justify-between px-2 pb-1">
        <p class="text-xs font-semibold text-fg-subtle">Labels</p>
        <button
          v-if="labelActions"
          type="button"
          class="grid size-6 place-items-center rounded-md text-fg-subtle hover:bg-surface-muted hover:text-fg"
          aria-label="Add label"
          title="Add label"
          @click="adding = true"
        >
          <i class="pi pi-plus text-[10px]" aria-hidden="true" />
        </button>
      </div>

      <div v-for="label in labels" :key="label.id" class="group relative">
        <LabelNameInput
          v-if="renamingId === label.id && labelActions"
          :initial="label.name"
          :color="label.color"
          :save="(name) => labelActions!.rename(label.id, name)"
          @done="renamingId = null"
        />
        <template v-else>
          <button
            type="button"
            :class="[item, 'pr-8', query.labelIds.includes(label.id) ? itemActive : itemIdle]"
            :aria-pressed="query.labelIds.includes(label.id)"
            @click="toggleLabel(label.id)"
            @dblclick="labelActions && openRename(label.id)"
          >
            <span
              :class="['w-5 text-center font-semibold', labelTextColor[label.color]]"
              aria-hidden="true"
              >#</span
            >
            <span class="min-w-0 flex-1 truncate">{{ label.name }}</span>
            <span
              class="text-xs text-fg-subtle"
              :class="labelActions && 'group-focus-within:invisible group-hover:invisible'"
              >{{ labelCounts[label.id] ?? 0 }}</span
            >
          </button>
          <button
            v-if="labelActions"
            type="button"
            class="absolute top-1/2 right-1 grid size-6 -translate-y-1/2 place-items-center rounded-md text-fg-subtle opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-surface hover:text-fg"
            :class="menuFor === label.id && 'opacity-100'"
            :aria-label="`Options for label ${label.name}`"
            :aria-expanded="menuFor === label.id"
            @click="menuFor = menuFor === label.id ? null : label.id"
          >
            <i class="pi pi-ellipsis-h text-xs" aria-hidden="true" />
          </button>
          <LabelMenu
            v-if="menuFor === label.id && labelActions"
            :label="label"
            :open-task-count="labelCounts[label.id] ?? 0"
            @close="menuFor = null"
            @rename="openRename(label.id)"
            @recolor="(color) => labelActions!.recolor(label.id, color)"
            @remove="removeLabel(label.id)"
          />
        </template>
      </div>

      <LabelNameInput
        v-if="adding && labelActions"
        :color="nextLabelColor(labels)"
        :save="labelActions.create"
        @done="adding = false"
      />
      <p v-if="labelActions && !labels.length && !adding" class="px-2 text-xs text-fg-subtle">
        No labels yet.
      </p>
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
