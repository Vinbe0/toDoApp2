<script setup lang="ts">
import { computed, ref } from "vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseCard from "@/components/ui/BaseCard.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import LabelChip from "@/components/tasks/LabelChip.vue";
import { labelName, priorityOptions } from "@/components/tasks/taskDisplay";
import type { Label, Priority } from "@/types/todo";

const props = defineProps<{ labels: Label[] }>();
const emit = defineEmits<{ submit: []; toggleLabel: [label: Label] }>();

const text = defineModel<string>("text", { required: true });
const description = defineModel<string>("description", { required: true });
const deadline = defineModel<string | null>("deadline", { required: true });
const priority = defineModel<Priority>("priority", { required: true });
const selectedLabels = defineModel<Label[]>("selectedLabels", { required: true });

const showDetails = ref(false);

const deadlineInput = computed({
  get: () => deadline.value ?? "",
  set: (value: string) => (deadline.value = value || null),
});

const submit = () => {
  if (!text.value.trim()) return;
  emit("submit");
  showDetails.value = false;
};
</script>

<template>
  <BaseCard as="form" class="grid gap-4" @submit.prevent="submit">
    <div class="flex gap-2">
      <BaseInput
        v-model="text"
        class="flex-1"
        aria-label="Task title"
        placeholder="What do you need to do?"
        @focus="showDetails = true"
      />
      <BaseButton type="submit" :disabled="!text.trim()">
        <i class="pi pi-plus" aria-hidden="true" />
        <span class="hidden sm:inline">Add task</span>
      </BaseButton>
    </div>

    <div v-if="showDetails || text" class="grid gap-4">
      <BaseInput
        v-model="description"
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
                priority === option.value
                  ? 'bg-surface text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              "
              :aria-pressed="priority === option.value"
              @click="priority = option.value"
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
              :selected="selectedLabels.includes(label)"
              @toggle="emit('toggleLabel', label)"
            >
              {{ labelName(label) }}
            </LabelChip>
          </div>
        </fieldset>
      </div>
    </div>
  </BaseCard>
</template>
