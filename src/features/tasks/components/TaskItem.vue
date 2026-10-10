<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import {
  describeDue,
  dueToneClass,
  labelHashColor,
  labelName,
  priorityCheckbox,
  priorityLabel,
} from "@/features/tasks/components/taskDisplay";
import type { Task } from "@/features/tasks/model/types";

const props = defineProps<{ task: Task; draggable: boolean }>();
const emit = defineEmits<{
  toggle: [];
  remove: [];
  rename: [text: string];
}>();

const editing = ref(false);
const editValue = ref("");
const editInput = ref<HTMLInputElement | null>(null);

const due = computed(() => describeDue(props.task));

async function startEdit() {
  editValue.value = props.task.text;
  editing.value = true;
  await nextTick();
  editInput.value?.focus();
  editInput.value?.select();
}

function saveEdit() {
  if (!editing.value) return;
  editing.value = false;
  emit("rename", editValue.value);
}

function cancelEdit() {
  editing.value = false;
}
</script>

<template>
  <li class="group relative flex items-start gap-3 border-b border-border py-3">
    <span
      v-if="draggable"
      class="drag-handle absolute top-3.5 -left-6 hidden cursor-grab text-fg-subtle opacity-0 transition group-hover:opacity-100 active:cursor-grabbing sm:block"
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
      :data-done="task.completed"
      class="group/check mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-full border-[1.5px] transition-colors data-[done=true]:text-white"
      :class="priorityCheckbox[task.priority]"
      @click="emit('toggle')"
    >
      <i
        class="pi pi-check text-[9px]"
        :class="task.completed ? 'opacity-100' : 'opacity-0 group-hover/check:opacity-100'"
        aria-hidden="true"
      />
    </button>

    <div class="min-w-0 flex-1">
      <input
        v-if="editing"
        ref="editInput"
        v-model="editValue"
        aria-label="Task title"
        class="-my-0.5 w-full rounded-md border border-brand-500 bg-surface px-1.5 py-0.5 text-sm text-fg focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
        @blur="saveEdit"
        @keyup.enter="saveEdit"
        @keyup.esc="cancelEdit"
      />
      <p
        v-else
        class="text-sm break-words text-fg"
        :class="task.completed && 'text-fg-subtle line-through'"
        title="Double-click to rename"
        @dblclick="startEdit"
      >
        {{ task.text }}
      </p>

      <p v-if="task.description" class="mt-0.5 text-xs break-words text-fg-muted">
        {{ task.description }}
      </p>

      <div
        v-if="due || task.labels.length"
        class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
      >
        <span v-if="due" class="inline-flex items-center gap-1" :class="dueToneClass[due.tone]">
          <i class="pi pi-calendar text-[10px]" aria-hidden="true" />
          <span v-if="due.tone === 'overdue'" class="sr-only">Overdue:</span>{{ due.text }}
        </span>
        <span v-for="label in task.labels" :key="label" class="text-fg-muted"
          ><span :class="labelHashColor[label]">#</span>{{ labelName(label) }}</span
        >
      </div>
      <span class="sr-only">{{ priorityLabel(task.priority) }} priority</span>
    </div>

    <div
      class="flex shrink-0 gap-0.5 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
    >
      <button
        type="button"
        class="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-surface-muted hover:text-fg"
        :aria-label="`Rename task ${task.text}`"
        @click="startEdit"
      >
        <i class="pi pi-pencil text-xs" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="grid size-7 place-items-center rounded-md text-fg-subtle hover:bg-red-500/10 hover:text-red-600"
        :aria-label="`Delete task ${task.text}`"
        @click="emit('remove')"
      >
        <i class="pi pi-trash text-xs" aria-hidden="true" />
      </button>
    </div>
  </li>
</template>
