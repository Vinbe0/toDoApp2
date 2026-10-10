<script setup lang="ts">
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import TaskSidebar from "@/features/tasks/components/TaskSidebar.vue";
import { sampleLabelsFor, sampleTasks } from "@/features/home/data/sampleTasks";
import { createDefaultQuery } from "@/features/tasks/model/query";
import { DEFAULT_LABELS } from "@/features/tasks/model/label";
import type { Task } from "@/features/tasks/model/types";

const tasks: Task[] = [
  sampleTasks.labReport,
  sampleTasks.pullRequest,
  sampleTasks.coffee,
  sampleTasks.setup,
];
</script>

<template>
  <!-- The real sidebar and task rows with sample data. -->
  <div class="grid text-left sm:grid-cols-[13rem_minmax(0,1fr)]">
    <div class="hidden border-r border-border bg-bg p-4 sm:block">
      <TaskSidebar
        :query="createDefaultQuery()"
        :labels="DEFAULT_LABELS"
        :counts="{ all: 4, active: 3, completed: 1 }"
        :label-counts="{ work: 1, shopping: 1, university: 1 }"
        account-name="Guest"
        account-hint="Saved in this browser"
      />
    </div>

    <div class="px-6 py-5">
      <p class="text-xl font-bold tracking-tight text-fg">All tasks</p>
      <p class="mt-0.5 mb-3 text-sm text-fg-subtle">3 active · 1 completed</p>
      <ul>
        <TaskItem
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :labels="sampleLabelsFor(task)"
          :draggable="false"
        />
      </ul>
      <p class="flex items-center gap-3 py-2.5 text-sm text-fg-muted">
        <span class="grid size-[1.125rem] place-items-center text-brand-600">
          <i class="pi pi-plus text-[10px]" aria-hidden="true" />
        </span>
        Add task
      </p>
    </div>
  </div>
</template>
