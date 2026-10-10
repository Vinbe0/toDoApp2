<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import BaseBadge from "@/shared/ui/BaseBadge.vue";
import {
  formatDate,
  isDueToday,
  isOverdue,
  labelName,
  priorityLabel,
  priorityTone,
} from "@/features/tasks/components/taskDisplay";
import type { Task } from "@/features/tasks/model/types";

const props = defineProps<{ task: Task; editing: boolean; draggable: boolean }>();
const emit = defineEmits<{
  toggle: [];
  remove: [];
  startEdit: [];
  saveEdit: [];
  cancelEdit: [];
}>();

const editValue = defineModel<string>("editValue", { required: true });
const editInput = ref<HTMLInputElement | null>(null);

watch(
  () => props.editing,
  async (editing) => {
    if (!editing) return;
    await nextTick();
    editInput.value?.focus();
    editInput.value?.select();
  },
);
</script>

<template>
  <li
    class="group flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-xs transition hover:shadow-md"
    :class="task.completed && 'opacity-70'"
  >
    <span
      v-if="draggable"
      class="drag-handle mt-0.5 hidden cursor-grab sm:block text-fg-subtle opacity-0 transition group-hover:opacity-100 active:cursor-grabbing"
      aria-hidden="true"
      title="Drag to reorder"
    >
      <i class="pi pi-bars text-xs" />
    </span>

    <button
      type="button"
      role="checkbox"
      :aria-checked="task.completed"
      :aria-label="`Mark ${task.text} as ${task.completed ? 'not done' : 'done'}`"
      class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors"
      :class="
        task.completed
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-fg-subtle hover:border-brand-500'
      "
      @click="emit('toggle')"
    >
      <i v-if="task.completed" class="pi pi-check text-[10px]" aria-hidden="true" />
    </button>

    <div class="min-w-0 flex-1">
      <input
        v-if="editing"
        ref="editInput"
        v-model="editValue"
        aria-label="Task title"
        class="h-8 w-full rounded-lg border border-brand-500 bg-surface px-2 font-medium text-fg focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        @blur="emit('saveEdit')"
        @keyup.enter="emit('saveEdit')"
        @keyup.esc="emit('cancelEdit')"
      />
      <p
        v-else
        class="font-medium break-words text-fg"
        :class="task.completed && 'text-fg-subtle line-through'"
        title="Double-click to rename"
        @dblclick="emit('startEdit')"
      >
        {{ task.text }}
      </p>

      <p v-if="task.description" class="mt-0.5 text-sm break-words text-fg-muted">
        {{ task.description }}
      </p>

      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        <BaseBadge :tone="priorityTone(task.priority)">
          <i class="pi pi-flag text-[10px]" aria-hidden="true" />
          {{ priorityLabel(task.priority) }}
        </BaseBadge>
        <BaseBadge v-if="task.deadline" :tone="isOverdue(task) ? 'red' : 'neutral'">
          <i class="pi pi-calendar text-[10px]" aria-hidden="true" />
          {{ isOverdue(task) ? "Overdue · " : isDueToday(task) ? "Today · " : ""
          }}{{ formatDate(task.deadline) }}
        </BaseBadge>
        <BaseBadge v-for="label in task.labels" :key="label">#{{ labelName(label) }}</BaseBadge>
      </div>
    </div>

    <div
      class="flex shrink-0 gap-1 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
    >
      <button
        type="button"
        class="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-surface-muted hover:text-fg"
        :aria-label="`Rename task ${task.text}`"
        @click="emit('startEdit')"
      >
        <i class="pi pi-pencil text-sm" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-red-500/10 hover:text-red-600"
        :aria-label="`Delete task ${task.text}`"
        @click="emit('remove')"
      >
        <i class="pi pi-trash text-sm" aria-hidden="true" />
      </button>
    </div>
  </li>
</template>
