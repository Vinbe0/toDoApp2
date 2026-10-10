<script setup lang="ts">
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import type { Task } from "@/features/tasks/model/types";
import { sampleTasks } from "@/features/home/data/sampleTasks";

const tasks: Task[] = [
  sampleTasks.labReport,
  sampleTasks.pullRequest,
  sampleTasks.coffee,
  sampleTasks.setup,
];

const views = [
  { label: "All tasks", count: 4, active: true },
  { label: "Active", count: 3 },
  { label: "Completed", count: 1 },
];
</script>

<template>
  <div class="grid text-left sm:grid-cols-[11rem_minmax(0,1fr)]">
    <aside class="hidden border-r border-border bg-bg p-3 sm:block">
      <p class="px-2 pb-2 text-xs font-semibold text-fg-subtle">Views</p>
      <p
        v-for="view in views"
        :key="view.label"
        class="flex justify-between rounded-lg px-2 py-1.5 text-sm"
        :class="view.active ? 'bg-brand-500/10 font-medium text-brand-700' : 'text-fg-muted'"
      >
        {{ view.label }} <span class="text-xs text-fg-subtle">{{ view.count }}</span>
      </p>
      <p class="px-2 pt-4 pb-2 text-xs font-semibold text-fg-subtle">Labels</p>
      <p
        v-for="label in ['Work', 'Shopping', 'University']"
        :key="label"
        class="px-2 py-1 text-sm text-fg-muted"
      >
        # {{ label }}
      </p>
    </aside>

    <div class="p-4">
      <p class="mb-3 text-lg font-semibold text-fg">My tasks</p>
      <ul class="grid gap-2">
        <TaskItem v-for="task in tasks" :key="task.id" :task="task" :draggable="false" />
      </ul>
    </div>
  </div>
</template>
