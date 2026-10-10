<script setup lang="ts">
import { computed } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import BaseBadge from "@/shared/ui/BaseBadge.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import EmptyState from "@/shared/ui/EmptyState.vue";
import TaskComposer from "@/features/tasks/components/TaskComposer.vue";
import TaskFilters from "@/features/tasks/components/TaskFilters.vue";
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import { useTasks } from "@/features/tasks/composables/useTasks";
import { LABELS } from "@/features/tasks/model/task";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { storeToRefs } from "pinia";

const { isRegistered } = storeToRefs(useAuthStore());
const {
  tasks,
  query,
  counts,
  draftTask,
  editing,
  draggableTasks,
  addNewTask,
  deleteTask,
  completeTask,
  startEdit,
  saveEdit,
  cancelEdit,
  clearCompleted,
  resetQuery,
  toggleDraftLabel,
} = useTasks();

// Manual ordering is only meaningful when the list isn't sorted.
const canReorder = computed(() => query.value.sort === "manual");
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
        @reset="resetQuery"
        @clear-completed="clearCompleted"
      />

      <section class="grid gap-4" aria-label="Tasks">
        <TaskComposer
          v-model:text="draftTask.text"
          v-model:description="draftTask.description"
          v-model:deadline="draftTask.deadline"
          v-model:priority="draftTask.priority"
          v-model:selected-labels="draftTask.labels"
          :labels="LABELS"
          @submit="addNewTask"
          @toggle-label="toggleDraftLabel"
        />

        <EmptyState
          v-if="!draggableTasks.length"
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
            @click="resetQuery"
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
