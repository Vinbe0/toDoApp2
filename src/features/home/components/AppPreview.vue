<script setup lang="ts">
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import type { Task } from "@/features/tasks/model/types";

/** A local calendar date relative to today, as YYYY-MM-DD. */
const day = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const tasks: Task[] = [
  {
    id: "1",
    text: "Submit the lab report",
    description: "Include the measurements from Tuesday",
    deadline: day(-1),
    priority: "high",
    labels: ["university"],
    completed: false,
  },
  {
    id: "2",
    text: "Review the pull request",
    description: "",
    deadline: day(0),
    priority: "medium",
    labels: ["work"],
    completed: false,
  },
  {
    id: "3",
    text: "Buy coffee beans",
    description: "",
    deadline: day(3),
    priority: "low",
    labels: ["shopping"],
    completed: false,
  },
  {
    id: "4",
    text: "Set up the project",
    description: "",
    deadline: null,
    priority: "medium",
    labels: ["work"],
    completed: true,
  },
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
