<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";
import { VueDraggable } from "vue-draggable-plus";
import BaseButton from "@/shared/ui/BaseButton.vue";
import EmptyState from "@/shared/ui/EmptyState.vue";
import TaskComposer from "@/features/tasks/components/TaskComposer.vue";
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import TaskListSkeleton from "@/features/tasks/components/TaskListSkeleton.vue";
import TaskSidebar, { type LabelActions } from "@/features/tasks/components/TaskSidebar.vue";
import ViewMenu from "@/features/tasks/components/ViewMenu.vue";
import { groupByDue, isQueryActive } from "@/features/tasks/model/query";
import { useLabelsStore } from "@/features/tasks/stores/labelsStore";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { useAuthStore } from "@/features/auth/stores/authStore";

const { isRegistered, user } = storeToRefs(useAuthStore());
const store = useTasksStore();
const { tasks, query, status, visibleTasks, counts, labelCounts, canReorder } = storeToRefs(store);

const labelsStore = useLabelsStore();
const { labels } = storeToRefs(labelsStore);

onMounted(() => {
  void store.load();
  void labelsStore.load();
});

// vue-draggable-plus needs a writable list; writes become a reorder.
const draggableTasks = computed({
  get: () => visibleTasks.value,
  set: (reordered) => store.reorder(reordered),
});

const sort = computed({
  get: () => query.value.sort,
  set: (value) => store.setQuery({ sort: value }),
});

/** Sorting by deadline shows date sections (Overdue, Today, …) instead of one list. */
const dueGroups = computed(() =>
  query.value.sort === "deadline" ? groupByDue(visibleTasks.value) : null,
);

const labelActions: LabelActions = {
  create: async (name) => (await labelsStore.create(name)) !== null,
  rename: (id, name) => labelsStore.rename(id, name),
  recolor: (id, color) => labelsStore.recolor(id, color),
  remove: (id) => labelsStore.remove(id),
};

const statusTitles = { all: "All tasks", active: "Active", completed: "Completed" } as const;

/** The heading names what's on screen: a search, a single label or a status view. */
const viewTitle = computed(() => {
  const { search, labelIds, status: viewStatus } = query.value;
  if (search.trim()) return `Search: “${search.trim()}”`;
  const onlyLabel = labelIds.length === 1 ? labelsStore.byId.get(labelIds[0]!) : undefined;
  if (onlyLabel && viewStatus === "all") return `#${onlyLabel.name}`;
  return statusTitles[viewStatus];
});

const account = computed(() =>
  isRegistered.value && user.value
    ? { name: user.value.email, hint: "Synced to your account" }
    : { name: "Guest", hint: "Saved in this browser" },
);

const sidebarOpen = ref(false);
const route = useRoute();
watch(
  () => route.fullPath,
  () => (sidebarOpen.value = false),
);
// On small screens, picking a view or label closes the drawer (typing a search doesn't).
watch(
  () => `${query.value.status}|${query.value.labelIds.join()}`,
  () => (sidebarOpen.value = false),
);

const composer = ref<InstanceType<typeof TaskComposer> | null>(null);
const addTask = () => {
  sidebarOpen.value = false;
  composer.value?.focus();
};
</script>

<template>
  <div class="mx-auto flex max-w-6xl lg:px-6">
    <!-- Sidebar: fixed column on large screens, slide-over drawer on small ones. -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/30 lg:hidden"
      aria-hidden="true"
      @click="sidebarOpen = false"
    />
    <aside
      id="task-sidebar"
      class="fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-border bg-bg p-4 transition-transform lg:sticky lg:top-16 lg:z-0 lg:h-[calc(100dvh-4rem)] lg:w-60 lg:translate-x-0 lg:border-r-0 lg:px-0 lg:py-6"
      :class="sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'"
    >
      <TaskSidebar
        v-model:query="query"
        :labels="labels"
        :counts="counts"
        :label-counts="labelCounts"
        :account-name="account.name"
        :account-hint="account.hint"
        :label-actions="labelActions"
        @add-task="addTask"
      />
    </aside>

    <section class="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:py-8" aria-label="Tasks">
      <div class="mx-auto max-w-3xl">
        <header class="mb-4 flex items-start justify-between gap-3">
          <div class="flex items-start gap-2">
            <button
              type="button"
              class="-ml-2 grid size-9 place-items-center rounded-md text-fg-muted hover:bg-surface-muted lg:hidden"
              aria-controls="task-sidebar"
              :aria-expanded="sidebarOpen"
              aria-label="Show views and labels"
              @click="sidebarOpen = true"
            >
              <i class="pi pi-bars" aria-hidden="true" />
            </button>
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-fg">{{ viewTitle }}</h1>
              <p class="mt-0.5 text-sm text-fg-subtle">
                {{ counts.active }} active · {{ counts.completed }} completed
              </p>
            </div>
          </div>
          <ViewMenu
            v-model:sort="sort"
            :can-reset="isQueryActive(query)"
            @reset="store.resetQuery"
            @clear-completed="store.clearCompleted"
          />
        </header>

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
              : 'Add your first task below to get started.'
          "
          class="mt-4"
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

        <template v-else-if="dueGroups">
          <section v-for="group in dueGroups" :key="group.key" class="mt-4 first:mt-0">
            <h2
              class="border-b border-border pb-1.5 text-sm font-semibold"
              :class="group.key === 'overdue' ? 'text-red-600 dark:text-red-400' : 'text-fg'"
            >
              {{ group.title }}
              <span class="ml-1 font-normal text-fg-subtle">{{ group.tasks.length }}</span>
            </h2>
            <ul>
              <TaskItem
                v-for="task in group.tasks"
                :key="task.id"
                :task="task"
                :labels="labelsStore.resolve(task.labelIds)"
                :draggable="false"
                @toggle="store.toggle(task.id)"
                @remove="store.remove(task.id)"
                @rename="store.rename(task.id, $event)"
              />
            </ul>
          </section>
        </template>

        <VueDraggable
          v-else
          v-model="draggableTasks"
          tag="ul"
          handle=".drag-handle"
          :disabled="!canReorder"
          :animation="150"
          ghost-class="opacity-40"
        >
          <TaskItem
            v-for="task in draggableTasks"
            :key="task.id"
            :task="task"
            :labels="labelsStore.resolve(task.labelIds)"
            :draggable="canReorder"
            @toggle="store.toggle(task.id)"
            @remove="store.remove(task.id)"
            @rename="store.rename(task.id, $event)"
          />
        </VueDraggable>

        <TaskComposer
          ref="composer"
          :labels="labels"
          :save="store.add"
          :create-label="labelsStore.create"
        />
      </div>
    </section>
  </div>
</template>
