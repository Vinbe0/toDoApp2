<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import TaskComposer from "@/features/tasks/components/TaskComposer.vue";
import TaskItem from "@/features/tasks/components/TaskItem.vue";
import WeekStrip from "@/features/tasks/components/WeekStrip.vue";
import {
  addDays,
  daysFrom,
  openTasksByDay,
  overdueTasks,
  parseIsoDate,
  todayIso,
  weekTitle,
  type IsoDate,
} from "@/features/tasks/model/calendar";
import type { Label, Task } from "@/features/tasks/model/types";
import type { NewTask } from "@/features/tasks/repositories";

const props = defineProps<{
  /** Tasks after search and label filters; completed ones are skipped here. */
  tasks: readonly Task[];
  labels: readonly Label[];
  resolveLabels: (ids: readonly string[]) => Label[];
  save: (task: NewTask) => Promise<boolean>;
  createLabel?: (name: string) => Promise<Label | null>;
  /** For tests; defaults to the real current date. */
  now?: Date;
}>();
const emit = defineEmits<{
  toggle: [id: string];
  remove: [id: string];
  rename: [id: string, text: string];
  reschedule: [id: string, deadline: string | null];
}>();

const today = computed(() => todayIso(props.now));
/** First day of the 7-day window: today, or a later day after paging forward. */
const anchor = ref<IsoDate>(todayIso(props.now));

const days = computed(() => daysFrom(anchor.value));
const isCurrentWeek = computed(() => anchor.value <= today.value);
const byDay = computed(() => openTasksByDay(props.tasks, days.value));
const counts = computed(() =>
  Object.fromEntries(days.value.map((day) => [day, byDay.value[day]?.length ?? 0])),
);
const overdue = computed(() => (isCurrentWeek.value ? overdueTasks(props.tasks, today.value) : []));

const showWeek = (offsetWeeks: number) => (anchor.value = addDays(anchor.value, offsetWeeks * 7));
const showToday = () => (anchor.value = today.value);

const composers = new Map<IsoDate, InstanceType<typeof TaskComposer>>();
const setComposer = (day: IsoDate, el: unknown) => {
  if (el) composers.set(day, el as InstanceType<typeof TaskComposer>);
  else composers.delete(day);
};

/** Opens the "+ Add task" editor under today (used by the sidebar's Add task). */
async function focusToday() {
  showToday();
  await nextTick();
  await composers.get(today.value)?.focus();
}

defineExpose({ focusToday });

async function scrollToDay(day: IsoDate) {
  await nextTick();
  document.getElementById(`day-${day}`)?.scrollIntoView?.({ behavior: "smooth", block: "start" });
}

// Drag a task onto another day (a section or a week-strip day) to move its due date.
const draggingId = ref<string | null>(null);
const overDay = ref<IsoDate | null>(null);

function onDragStart(event: DragEvent, task: Task) {
  draggingId.value = task.id;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
  }
}
function onDragEnd() {
  draggingId.value = null;
  overDay.value = null;
}
function onDragOver(event: DragEvent, day: IsoDate) {
  if (!draggingId.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  overDay.value = day;
}
function onDragLeave(event: DragEvent, day: IsoDate) {
  const target = event.currentTarget as HTMLElement | null;
  if (target?.contains(event.relatedTarget as Node | null)) return;
  if (overDay.value === day) overDay.value = null;
}
function dropOn(day: IsoDate) {
  const id = draggingId.value;
  onDragEnd();
  const task = id && props.tasks.find((item) => item.id === id);
  if (task && task.deadline?.slice(0, 10) !== day) emit("reschedule", task.id, day);
}

function dayHeading(day: IsoDate) {
  const date = parseIsoDate(day).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  if (day === today.value) return `Today · ${date}`;
  if (day === addDays(today.value, 1)) return `Tomorrow · ${date}`;
  return date;
}
</script>

<template>
  <div>
    <div class="mb-3 flex items-center justify-between gap-2">
      <p class="text-sm font-semibold text-fg">{{ weekTitle(days) }}</p>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-surface-muted disabled:opacity-40"
          aria-label="Previous week"
          :disabled="isCurrentWeek"
          @click="showWeek(-1)"
        >
          <i class="pi pi-chevron-left text-xs" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-fg-muted hover:bg-surface-muted disabled:opacity-40"
          :disabled="isCurrentWeek"
          @click="showToday"
        >
          Today
        </button>
        <button
          type="button"
          class="grid size-8 place-items-center rounded-md text-fg-muted hover:bg-surface-muted"
          aria-label="Next week"
          @click="showWeek(1)"
        >
          <i class="pi pi-chevron-right text-xs" aria-hidden="true" />
        </button>
      </div>
    </div>

    <WeekStrip
      :days="days"
      :today="today"
      :counts="counts"
      class="mb-6 border-b border-border pb-3"
      :accepts-drop="draggingId !== null"
      @select="scrollToDay"
      @drop-task="dropOn"
    />

    <section v-if="overdue.length" class="mb-6" aria-labelledby="day-overdue-title">
      <h2
        id="day-overdue-title"
        class="border-b border-border pb-1.5 text-sm font-semibold text-red-600 dark:text-red-400"
      >
        Overdue <span class="ml-1 font-normal text-fg-subtle">{{ overdue.length }}</span>
      </h2>
      <ul>
        <TaskItem
          v-for="task in overdue"
          :key="task.id"
          :task="task"
          :labels="resolveLabels(task.labelIds)"
          :reorderable="false"
          draggable="true"
          class="cursor-grab active:cursor-grabbing"
          :class="draggingId === task.id && 'opacity-40'"
          @dragstart="onDragStart($event, task)"
          @dragend="onDragEnd"
          @toggle="emit('toggle', task.id)"
          @remove="emit('remove', task.id)"
          @rename="emit('rename', task.id, $event)"
          @reschedule="emit('reschedule', task.id, $event)"
        />
      </ul>
    </section>

    <section
      v-for="day in days"
      :id="`day-${day}`"
      :key="day"
      class="-mx-2 mb-4 scroll-mt-20 rounded-lg px-2 pb-2 transition-colors"
      :class="overDay === day && 'bg-brand-500/5 ring-1 ring-brand-500/40'"
      :aria-label="dayHeading(day)"
      @dragover="onDragOver($event, day)"
      @dragleave="onDragLeave($event, day)"
      @drop.prevent="dropOn(day)"
    >
      <h2
        class="border-b border-border pb-1.5 text-sm font-semibold"
        :class="day === today ? 'text-brand-700 dark:text-brand-300' : 'text-fg'"
      >
        {{ dayHeading(day) }}
        <span v-if="byDay[day]?.length" class="ml-1 font-normal text-fg-subtle">
          {{ byDay[day]!.length }}
        </span>
      </h2>
      <ul>
        <TaskItem
          v-for="task in byDay[day]"
          :key="task.id"
          :task="task"
          :labels="resolveLabels(task.labelIds)"
          :reorderable="false"
          draggable="true"
          class="cursor-grab active:cursor-grabbing"
          :class="draggingId === task.id && 'opacity-40'"
          @dragstart="onDragStart($event, task)"
          @dragend="onDragEnd"
          @toggle="emit('toggle', task.id)"
          @remove="emit('remove', task.id)"
          @rename="emit('rename', task.id, $event)"
          @reschedule="emit('reschedule', task.id, $event)"
        />
      </ul>
      <TaskComposer
        :ref="(el) => setComposer(day, el)"
        :labels="labels"
        :save="save"
        :create-label="createLabel"
        :default-deadline="day"
      />
    </section>
  </div>
</template>
