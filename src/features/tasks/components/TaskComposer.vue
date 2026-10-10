<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import LabelChip from "@/features/tasks/components/LabelChip.vue";
import {
  describeDue,
  dueToneClass,
  priorityOptions,
} from "@/features/tasks/components/taskDisplay";
import type { Label, Priority } from "@/features/tasks/model/types";
import type { NewTask } from "@/features/tasks/repositories";

const props = defineProps<{
  labels: readonly Label[];
  /** Saves the task; the form resets only when this resolves to true. */
  save: (task: NewTask) => Promise<boolean>;
}>();

const createDraft = (): NewTask => ({
  text: "",
  description: "",
  deadline: null,
  priority: "medium",
  labels: [],
});

const open = ref(false);
const draft = ref<NewTask>(createDraft());
const saving = ref(false);
const titleInput = ref<HTMLInputElement | null>(null);

const deadlineInput = computed({
  get: () => draft.value.deadline ?? "",
  set: (value: string) => (draft.value.deadline = value || null),
});

/** Friendly preview of the chosen date, e.g. "Tomorrow". */
const due = computed(() => describeDue({ ...draft.value, id: "", completed: false }));

const priorityDot: Record<Priority, string> = {
  high: "text-red-500",
  medium: "text-amber-500",
  low: "text-sky-500",
};

const toggleLabel = (label: Label) => {
  const labels = draft.value.labels;
  draft.value.labels = labels.includes(label)
    ? labels.filter((item) => item !== label)
    : [...labels, label];
};

/** Opens the editor and moves the cursor into the title (also used by the sidebar). */
async function focus() {
  open.value = true;
  await nextTick();
  // focus() also scrolls the field into view.
  titleInput.value?.focus();
}

defineExpose({ focus });

function cancel() {
  draft.value = createDraft();
  open.value = false;
}

async function submit() {
  if (!draft.value.text.trim() || saving.value) return;
  saving.value = true;
  try {
    if (await props.save({ ...draft.value, labels: [...draft.value.labels] })) {
      // Stay open so several tasks can be added in a row.
      draft.value = createDraft();
      await nextTick();
      titleInput.value?.focus();
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <button
    v-if="!open"
    type="button"
    class="group flex w-full items-center gap-3 py-2.5 text-left text-sm text-fg-muted hover:text-brand-700 dark:hover:text-brand-300"
    @click="focus"
  >
    <span
      class="grid size-[1.125rem] place-items-center rounded-full text-brand-600 group-hover:bg-brand-600 group-hover:text-white"
    >
      <i class="pi pi-plus text-[10px]" aria-hidden="true" />
    </span>
    Add task
  </button>

  <form
    v-else
    class="my-2 rounded-xl border border-border bg-surface p-3 shadow-sm focus-within:border-fg-subtle"
    @submit.prevent="submit"
    @keydown.esc="cancel"
  >
    <input
      ref="titleInput"
      v-model="draft.text"
      aria-label="Task title"
      placeholder="Task name"
      class="w-full bg-transparent text-sm font-medium text-fg placeholder:text-fg-subtle focus:outline-none"
    />
    <input
      v-model="draft.description"
      aria-label="Description"
      placeholder="Description"
      class="mt-1 w-full bg-transparent text-xs text-fg-muted placeholder:text-fg-subtle focus:outline-none"
    />

    <div class="mt-3 flex flex-wrap items-center gap-1.5">
      <label
        class="relative inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 text-xs text-fg-muted hover:bg-surface-muted"
      >
        <i class="pi pi-calendar text-[11px]" aria-hidden="true" />
        <span :class="due && dueToneClass[due.tone]">{{ due?.text ?? "Date" }}</span>
        <input
          v-model="deadlineInput"
          type="date"
          aria-label="Deadline"
          class="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <label
        class="inline-flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-fg-muted hover:bg-surface-muted"
      >
        <i :class="['pi pi-flag text-[11px]', priorityDot[draft.priority]]" aria-hidden="true" />
        <select
          v-model="draft.priority"
          aria-label="Priority"
          class="cursor-pointer appearance-none bg-transparent focus:outline-none"
        >
          <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
            {{ option.label }} priority
          </option>
        </select>
      </label>

      <LabelChip
        v-for="label in props.labels"
        :key="label"
        :label="label"
        :selected="draft.labels.includes(label)"
        @toggle="toggleLabel(label)"
      />
    </div>

    <div class="mt-3 flex justify-end gap-2 border-t border-border pt-3">
      <BaseButton variant="secondary" size="sm" @click="cancel">Cancel</BaseButton>
      <BaseButton type="submit" size="sm" :disabled="!draft.text.trim()" :loading="saving">
        Add task
      </BaseButton>
    </div>
  </form>
</template>
