<script setup lang="ts">
import BaseBadge from "@/shared/ui/BaseBadge.vue";
import FeatureStory from "@/features/home/components/FeatureStory.vue";
import TaskSidebar from "@/features/tasks/components/TaskSidebar.vue";
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import { sampleLabelsFor, sampleTasks } from "@/features/home/data/sampleTasks";
import { createDefaultQuery } from "@/features/tasks/model/query";
import { DEFAULT_LABELS } from "@/features/tasks/model/label";

const byDeadline = [sampleTasks.labReport, sampleTasks.pullRequest, sampleTasks.coffee];
const filterQuery = {
  ...createDefaultQuery(),
  status: "active" as const,
  sort: "priority" as const,
  labelIds: ["work"],
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
        <TaskItem
          v-for="task in byDeadline"
          :key="task.id"
          :task="task"
          :labels="sampleLabelsFor(task)"
          :reorderable="false"
        />
      </ul>
    </FeatureStory>

    <FeatureStory
      eyebrow="Filters"
      title="Narrow it down in a couple of clicks."
      text="Views, labels and search work together: active work tasks is two clicks, and the View menu sorts by deadline or priority."
      tint="cream"
      reverse
    >
      <div class="mx-auto max-w-xs p-5">
        <TaskSidebar
          :query="filterQuery"
          :labels="DEFAULT_LABELS"
          :counts="{ all: 5, active: 4, completed: 1 }"
          :label-counts="{ work: 3, shopping: 1, university: 1 }"
          account-name="Guest"
          account-hint="Saved in this browser"
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
          <TaskItem
            :task="sampleTasks.coffee"
            :labels="sampleLabelsFor(sampleTasks.coffee)"
            :reorderable="false"
          />
          <TaskItem
            :task="sampleTasks.setup"
            :labels="sampleLabelsFor(sampleTasks.setup)"
            :reorderable="false"
          />
        </ul>
      </div>
    </FeatureStory>
  </div>
</template>
