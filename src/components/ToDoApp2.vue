<template>
  <section class="min-h-[calc(100dvh-5rem)] w-full">
    <div
      class="grid min-h-[calc(100dvh-5rem)] w-full items-stretch lg:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <aside class="h-full w-full border-r border-gray-200 bg-gray-50 p-3">
        <h2 class="mb-6 text-xl font-bold text-black">Search by title</h2>
        <input
        type="text"
        class="rounded-2xl bg-gray-200 px-2 py-1.5 font-semibold"
        placeholder="Enter title..."
        />
        <h2 class="mb-6 text-xl font-bold text-black">Filters</h2>

        <div class="grid gap-2">
          <button
            v-for="item in filterButtons"
            :key="item.value"
            class="rounded-xl px-2 py-1 text-left font-bold text-black hover:bg-green-600/40"
            :class="filter === item.value ? 'border-green-600 bg-green-100' : ''"
            @click="filter = item.value"
          >
            {{ item.label }}
          </button>

          <button
            class="rounded-xl px-2 py-1 text-left font-bold text-black hover:bg-green-600/40"
            :class="filter === 'byLabel' ? 'bg-green-100' : ''"
            @click="openLabelFilter"
          >
            Filter by labels
          </button>
        </div>

        <div v-if="labelFilterOpen" class="mt-3 grid gap-2">
          <select
            class="rounded-2xl bg-amber-50 px-2 py-2 font-bold text-black"
            multiple
            size="3"
          >
            <option
              v-for="label in availableLabels"
              :key="`filter-${label}`"
              :value="label"
              :selected="selectedLabels.includes(label)"
              @mousedown.prevent="toggleSelectedLabel(label)"
            >
              {{ label[0].toUpperCase() + label.slice(1) }}
            </option>
          </select>

          <label class="text-sm text-black">
            <input type="checkbox" v-model="strictLabelFilter" />
            Task must match all labels
          </label>

          <button
            class="rounded-2xl border border-blue-700 bg-blue-500 px-2 py-1 font-bold text-black"
            @click="filter = 'byLabel'"
          >
            Apply
          </button>
        </div>

        <button
          class="mt-4 w-full rounded-xl border border-red-500 bg-red-500 px-2 py-2 font-bold text-white duration-200 hover:bg-red-600"
          @click="clearCompleted"
        >
          Clear completed tasks
        </button>
      </aside>

      <div class="flex min-h-full min-w-0 flex-col gap-4 bg-gray-100 p-3">
        <form
          class="flex w-full flex-col gap-3 rounded-2xl bg-white p-4 shadow-md"
          @submit.prevent="addNewTask"
        >
          <label for="newTask" class="font-bold text-2xl text-black">
            Add your new task
          </label>

          <input
            id="newTask"
            type="text"
            placeholder="Add a new task :)"
            class="h-11 rounded-2xl bg-gray-200 px-3 font-semibold text-black"
            v-model="draftTask.text"
          />

          <div class="grid gap-2 sm:grid-cols-2">
            <input
              type="date"
              class="h-12 rounded-2xl bg-gray-200 px-2 font-bold text-black"
              required
              v-model="draftDeadline"
            />

            <select
              class="h-12 rounded-2xl bg-gray-200 px-2 font-bold text-black appearance-none"
              v-model="draftTask.priority"
            >
              <option value="high">🔥 High Priority</option>
              <option value="medium">⚡ Medium Priority</option>
              <option value="low">☁️ Low Priority</option>
            </select>
          </div>

          <textarea
            id="newTaskDescription"
            placeholder="Add task description..."
            class="h-22 rounded-2xl bg-gray-200 px-3 py-1 font-semibold text-black"
            v-model="draftTask.description"
          />

          <select
            class="rounded-2xl bg-gray-200 px-2 py-2 font-bold text-black"
            multiple
            size="3"
          >
            <option
              v-for="label in availableLabels"
              :key="`new-${label}`"
              :value="label"
              :selected="draftTask.labels.includes(label)"
              @mousedown.prevent="toggleDraftLabel(label)"
            >
              {{ label[0].toUpperCase() + label.slice(1) }}
            </option>
          </select>

          <button
            type="submit"
            class="h-10 w-[20%] rounded-2xl border border-green-700 bg-green-700 font-bold text-amber-50 duration-200 hover:bg-green-800"
          >
            Add Task
          </button>
        </form>

        <h2 class="text-center text-3xl font-bold text-black">Your tasks</h2>

        <VueDraggable
          v-model="draggableTasks"
          item-key="id"
          class="draggable-list flex list-none flex-col gap-3"
        >
          <div
            v-for="task in draggableTasks"
            :key="task.id"
            class="min-w-0 rounded-xl bg-white/50 px-4 py-2 text-lg font-bold text-black shadow-sm"
            :class="[filter === 'byPriority' ? priorityStyles[task.priority] : '']"
          >
            <div class="flex items-start gap-3">
              <button
                class="h-8 w-8 shrink-0 rounded-full border border-green-600 bg-green-500 font-bold text-amber-50 duration-300 hover:border-red-600 hover:bg-red-500"
                @click="deleteTask(task.id)"
              >
                X
              </button>

              <div class="flex min-w-0 flex-1 gap-2">
                <input
                  type="checkbox"
                  class="mt-1 h-5 w-5 shrink-0 rounded-full disabled:cursor-not-allowed"
                  :checked="task.completed"
                  :class="{ 'accent-gray-500': task.completed }"
                  @click="completeTask(task.id)"
                />

                <div class="min-w-0 flex-1">
                  <div
                    v-if="editing.id !== task.id"
                    class="flex min-w-0 items-start gap-2"
                    @dblclick="startEdit(task)"
                  >
                    <div class="min-w-0 flex-1">
                      <p class="break-words" :class="{ 'line-through text-gray-500': task.completed }">
                        {{ task.text }}
                      </p>
                      <p
                        v-if="task.description"
                        class="mt-1 break-words text-sm font-medium text-gray-600"
                        :class="{ 'line-through text-gray-400': task.completed }"
                      >
                        {{ task.description }}
                      </p>
                    </div>

                    <div class="flex shrink-0 flex-col items-end gap-1">
                      <span class="whitespace-nowrap text-sm text-gray-400">{{ task.deadline }}</span>
                      <ul class="flex max-w-[10rem] flex-wrap justify-end gap-1">
                        <li class="whitespace-nowrap text-sm" :class="priorityStyles[task.priority]">
                          {{ task.priority }}
                        </li>
                        <li
                          v-for="label in task.labels"
                          :key="label"
                          class="whitespace-nowrap rounded-2xl bg-gray-200 px-2 text-sm text-gray-600"
                        >
                          {{ label }}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <input
                    v-else
                    class="h-8 w-full rounded-xl border bg-amber-50 px-1 font-bold text-black"
                    v-model="editing.value"
                    @blur="saveEdit"
                    @keyup.enter="saveEdit"
                  />
                </div>
              </div>
            </div>
          </div>
        </VueDraggable>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import {
  availableLabels,
  priorityStyles,
  useTasks,
} from "@/composables/useTasks";
import type { FilterMode } from "@/types/todo";

const filterButtons: Array<{ label: string; value: FilterMode }> = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Sort all by date", value: "byDate" },
  { label: "Sort by priority", value: "byPriority" },
];

const {
  draftTask,
  filter,
  editing,
  selectedLabels,
  labelFilterOpen,
  strictLabelFilter,
  draggableTasks,
  addNewTask,
  deleteTask,
  completeTask,
  startEdit,
  saveEdit,
  clearCompleted,
  openLabelFilter,
  toggleDraftLabel,
  toggleSelectedLabel,
} = useTasks();

const draftDeadline = computed({
  get() {
    return draftTask.value.deadline ?? "";
  },
  set(value: string) {
    draftTask.value.deadline = value || null;
  },
});
</script>
