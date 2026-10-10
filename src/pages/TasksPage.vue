<script setup lang="ts">
import { computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { VueDraggable } from "vue-draggable-plus";
import BaseBadge from "@/shared/ui/BaseBadge.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import EmptyState from "@/shared/ui/EmptyState.vue";
import TaskComposer from "@/features/tasks/components/TaskComposer.vue";
import TaskFilters from "@/features/tasks/components/TaskFilters.vue";
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import TaskListSkeleton from "@/features/tasks/components/TaskListSkeleton.vue";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { LABELS } from "@/features/tasks/model/task";
import { useAuthStore } from "@/features/auth/stores/authStore";

const { isRegistered } = storeToRefs(useAuthStore());
const store = useTasksStore();
const { tasks, query, status, visibleTasks, counts, canReorder } = storeToRefs(store);

onMounted(() => void store.load());

// vue-draggable-plus needs a writable list; writes become a reorder.
const draggableTasks = computed({
  get: () => visibleTasks.value,
  set: (reordered) => store.reorder(reordered),
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <header class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold tracking-tight text-fg">My tasks</h1>
        <p class="mt-1 text-sm text-fg-muted">
          {{ counts.active }} active · {{ counts.completed }} completed
        </p>
      </div>
      <BaseBadge :tone="isRegistered ? 'brand' : 'neutral'">
        <i
          :class="['pi', isRegistered ? 'pi-cloud' : 'pi-desktop', 'text-[10px]']"
          aria-hidden="true"
        />
        {{ isRegistered ? "Synced to your account" : "Guest mode · saved in this browser" }}
      </BaseBadge>
    </header>

    <div class="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <TaskFilters
        v-model:query="query"
        :labels="LABELS"
        :counts="counts"
        @reset="store.resetQuery"
        @clear-completed="store.clearCompleted"
      />

      <section class="grid gap-4" aria-label="Tasks">
        <TaskComposer :labels="LABELS" :save="store.add" />

        <TaskListSkeleton v-if="status === 'loading' && !tasks.length" />

        <EmptyState
          v-else-if="status === 'error' && !tasks.length"
          icon="pi-exclamation-triangle"
          title="Couldn't load your tasks"
          description="Check your connection and try again."
        >
          <BaseButton variant="secondary" size="sm" class="mt-2" @click="store.load">
            Try again
          </BaseButton>
        </EmptyState>

        <EmptyState
          v-else-if="!draggableTasks.length"
          :icon="tasks.length ? 'pi-filter-slash' : 'pi-check-square'"
          :title="tasks.length ? 'No tasks match this view' : 'No tasks yet'"
          :description="
            tasks.length
              ? 'Try another filter or search term.'
              : 'Add your first task above to get started.'
          "
        >
          <BaseButton
            v-if="tasks.length"
            variant="secondary"
            size="sm"
            class="mt-2"
            @click="store.resetQuery"
          >
            Reset filters
          </BaseButton>
        </EmptyState>

        <VueDraggable
          v-else
          v-model="draggableTasks"
          tag="ul"
          handle=".drag-handle"
          :disabled="!canReorder"
          :animation="150"
          ghost-class="opacity-40"
          class="grid gap-2"
        >
          <TaskItem
            v-for="task in draggableTasks"
            :key="task.id"
            :task="task"
            :draggable="canReorder"
            @toggle="store.toggle(task.id)"
            @remove="store.remove(task.id)"
            @rename="store.rename(task.id, $event)"
          />
        </VueDraggable>
      </section>
    </div>
  </div>
</template>
