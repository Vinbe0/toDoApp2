<script setup lang="ts">
import { computed, watch } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import BaseBadge from "@/components/ui/BaseBadge.vue";
import EmptyState from "@/components/ui/EmptyState.vue";
import TaskComposer from "@/components/tasks/TaskComposer.vue";
import TaskFilters from "@/components/tasks/TaskFilters.vue";
import TaskItem from "@/components/tasks/TaskItem.vue";
import { availableLabels, useTasks } from "@/composables/useTasks";
import { useAuth } from "@/composables/useAuth";

const { isRegistered } = useAuth();
const {
  tasks,
  draftTask,
  filter,
  editing,
  selectedLabels,
  searchTitle,
  strictLabelFilter,
  draggableTasks,
  addNewTask,
  deleteTask,
  handleSearch,
  completeTask,
  startEdit,
  saveEdit,
  cancelEdit,
  clearCompleted,
  toggleDraftLabel,
  toggleSelectedLabel,
} = useTasks();

const counts = computed(() => {
  const completed = tasks.value.filter((task) => task.completed).length;
  return { all: tasks.value.length, active: tasks.value.length - completed, completed };
});

// Manual ordering only makes sense when the full, unsorted list is shown.
const canReorder = computed(() => filter.value === "all");

watch(filter, (value) => {
  if (value !== "byTitle") searchTitle.value = "";
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
        <i :class="['pi', isRegistered ? 'pi-cloud' : 'pi-desktop', 'text-[10px]']" aria-hidden="true" />
        {{ isRegistered ? "Synced to your account" : "Guest mode · saved in this browser" }}
      </BaseBadge>
    </header>

    <div class="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <TaskFilters
        v-model:filter="filter"
        v-model:search="searchTitle"
        v-model:strict-labels="strictLabelFilter"
        :labels="availableLabels"
        :selected-labels="selectedLabels"
        :counts="counts"
        @search="handleSearch"
        @toggle-label="toggleSelectedLabel"
        @clear-completed="clearCompleted"
      />

      <section class="grid gap-4" aria-label="Tasks">
        <TaskComposer
          v-model:text="draftTask.text"
          v-model:description="draftTask.description"
          v-model:deadline="draftTask.deadline"
          v-model:priority="draftTask.priority"
          v-model:selected-labels="draftTask.labels"
          :labels="availableLabels"
          @submit="addNewTask"
          @toggle-label="toggleDraftLabel"
        />

        <EmptyState
          v-if="!draggableTasks.length"
          :icon="tasks.length ? 'pi-filter-slash' : 'pi-check-square'"
          :title="tasks.length ? 'No tasks match this view' : 'No tasks yet'"
          :description="tasks.length ? 'Try another filter or search term.' : 'Add your first task above to get started.'"
        />

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
            v-model:edit-value="editing.value"
            :task="task"
            :editing="editing.id === task.id"
            :draggable="canReorder"
            @toggle="completeTask(task.id)"
            @remove="deleteTask(task.id)"
            @start-edit="startEdit(task)"
            @save-edit="saveEdit"
            @cancel-edit="cancelEdit"
          />
        </VueDraggable>
      </section>
    </div>
  </div>
</template>
