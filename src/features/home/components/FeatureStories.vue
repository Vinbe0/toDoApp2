<script setup lang="ts">
import BaseBadge from "@/shared/ui/BaseBadge.vue";
import FeatureStory from "@/features/home/components/FeatureStory.vue";
import TaskFilters from "@/features/tasks/components/TaskFilters.vue";
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import { sampleTasks } from "@/features/home/data/sampleTasks";
import { createDefaultQuery } from "@/features/tasks/model/query";
import { LABELS } from "@/features/tasks/model/task";

const byDeadline = [sampleTasks.labReport, sampleTasks.pullRequest, sampleTasks.coffee];
const filterQuery = {
  ...createDefaultQuery(),
  status: "active" as const,
  sort: "priority" as const,
  labels: ["work" as const],
};
</script>

<template>
  <div class="mx-auto max-w-6xl divide-y divide-border px-4 sm:px-6">
    <FeatureStory
      eyebrow="Deadlines"
      title="See what's late before it's a problem."
      text="Give a task a date and TODOS keeps an eye on it. Overdue tasks turn red, today's are marked, and sorting by deadline puts the most urgent ones first."
      tint="peach"
    >
      <ul class="grid gap-2 p-4">
        <TaskItem v-for="task in byDeadline" :key="task.id" :task="task" :draggable="false" />
      </ul>
    </FeatureStory>

    <FeatureStory
      eyebrow="Filters"
      title="Narrow it down in a couple of clicks."
      text="Search, status, labels and sort order all work together: active work tasks sorted by priority is one click each, and Reset brings everything back."
      tint="cream"
      reverse
    >
      <div class="mx-auto max-w-xs p-5">
        <TaskFilters
          :query="filterQuery"
          :labels="LABELS"
          :counts="{ all: 5, active: 4, completed: 1 }"
          class="!border-0 !p-0 !shadow-none"
        />
      </div>
    </FeatureStory>

    <FeatureStory
      eyebrow="Accounts"
      title="Start as a guest, keep everything when you sign up."
      text="Your first list lives in this browser, with no form to fill in. Create an account later and your guest tasks are imported, then synced wherever you log in."
      tint="mint"
    >
      <div class="p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p class="text-lg font-semibold text-fg">My tasks</p>
          <BaseBadge>Guest mode · saved in this browser</BaseBadge>
        </div>
        <ul class="grid gap-2">
          <TaskItem :task="sampleTasks.coffee" :draggable="false" />
          <TaskItem :task="sampleTasks.setup" :draggable="false" />
        </ul>
      </div>
    </FeatureStory>
  </div>
</template>
