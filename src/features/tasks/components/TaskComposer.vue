<script setup lang="ts">
import { computed, ref } from "vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseCard from "@/shared/ui/BaseCard.vue";
import BaseInput from "@/shared/ui/BaseInput.vue";
import LabelChip from "@/features/tasks/components/LabelChip.vue";
import { labelName, priorityOptions } from "@/features/tasks/components/taskDisplay";
import type { Label } from "@/features/tasks/model/types";
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

const draft = ref<NewTask>(createDraft());
const showDetails = ref(false);
const saving = ref(false);

const deadlineInput = computed({
  get: () => draft.value.deadline ?? "",
  set: (value: string) => (draft.value.deadline = value || null),
});

const toggleLabel = (label: Label) => {
  const labels = draft.value.labels;
  draft.value.labels = labels.includes(label)
    ? labels.filter((item) => item !== label)
    : [...labels, label];
};

const form = ref<{ $el: HTMLElement } | null>(null);

/** Moves the cursor into the title field (used by the sidebar's "Add task"). */
function focus() {
  showDetails.value = true;
  form.value?.$el.querySelector<HTMLInputElement>('input[aria-label="Task title"]')?.focus();
}

defineExpose({ focus });

const submit = async () => {
  if (!draft.value.text.trim() || saving.value) return;
  saving.value = true;
  try {
    if (await props.save({ ...draft.value, labels: [...draft.value.labels] })) {
      draft.value = createDraft();
      showDetails.value = false;
    }
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <BaseCard ref="form" as="form" class="grid gap-4" @submit.prevent="submit">
    <div class="flex gap-2">
      <BaseInput
        v-model="draft.text"
        class="flex-1"
        aria-label="Task title"
        placeholder="What do you need to do?"
        @focus="showDetails = true"
      />
      <BaseButton type="submit" :disabled="!draft.text.trim()" :loading="saving">
        <i class="pi pi-plus" aria-hidden="true" />
        <span class="hidden sm:inline">Add task</span>
      </BaseButton>
    </div>

    <div v-if="showDetails || draft.text" class="grid gap-4">
      <BaseInput
        v-model="draft.description"
        multiline
        rows="2"
        placeholder="Description (optional)"
        aria-label="Description"
      />

      <div class="flex flex-wrap items-end gap-x-6 gap-y-4">
        <label class="grid gap-1.5 text-sm font-medium text-fg">
          Deadline
          <input
            v-model="deadlineInput"
            type="date"
            class="h-9 rounded-xl border border-border bg-surface px-3 text-sm text-fg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
        </label>

        <fieldset class="grid gap-1.5">
          <legend class="mb-1.5 text-sm font-medium text-fg">Priority</legend>
          <div class="inline-flex rounded-xl border border-border bg-surface-muted p-0.5">
            <button
              v-for="option in priorityOptions"
              :key="option.value"
              type="button"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              :class="
                draft.priority === option.value
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              "
              :aria-pressed="draft.priority === option.value"
              @click="draft.priority = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend class="mb-1.5 text-sm font-medium text-fg">Labels</legend>
          <div class="flex flex-wrap gap-1.5">
            <LabelChip
              v-for="label in props.labels"
              :key="label"
              :selected="draft.labels.includes(label)"
              @toggle="toggleLabel(label)"
            >
              {{ labelName(label) }}
            </LabelChip>
          </div>
        </fieldset>
      </div>
    </div>
  </BaseCard>
</template>
