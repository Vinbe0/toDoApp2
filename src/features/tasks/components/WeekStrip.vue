<script setup lang="ts">
import { ref } from "vue";
import { parseIsoDate, type IsoDate } from "@/features/tasks/model/calendar";

const props = defineProps<{
  days: readonly IsoDate[];
  today: IsoDate;
  /** Open tasks due on each day. */
  counts: Record<IsoDate, number>;
  /** True while a task is being dragged, so days accept it as a drop target. */
  acceptsDrop?: boolean;
}>();
const emit = defineEmits<{ select: [day: IsoDate]; dropTask: [day: IsoDate] }>();

const overDay = ref<IsoDate | null>(null);
function onDragOver(event: DragEvent, day: IsoDate) {
  if (!props.acceptsDrop) return;
  event.preventDefault();
  overDay.value = day;
}
function onDrop(day: IsoDate) {
  overDay.value = null;
  emit("dropTask", day);
}

const weekday = (iso: IsoDate) =>
  parseIsoDate(iso).toLocaleDateString("en-GB", { weekday: "short" });
const dayOfMonth = (iso: IsoDate) => parseIsoDate(iso).getDate();
const fullDate = (iso: IsoDate) =>
  parseIsoDate(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
</script>

<template>
  <ol class="grid grid-cols-7 gap-1" aria-label="Next seven days">
    <li v-for="day in days" :key="day">
      <button
        type="button"
        class="flex w-full flex-col items-center gap-0.5 rounded-lg py-2 text-xs transition-colors"
        :class="[
          day === today
            ? 'bg-brand-500/10 text-brand-700 dark:text-brand-300'
            : 'text-fg-muted hover:bg-surface-muted',
          overDay === day && 'ring-2 ring-brand-500',
        ]"
        :aria-current="day === today ? 'date' : undefined"
        :aria-label="`${fullDate(day)}, ${counts[day] ?? 0} task${counts[day] === 1 ? '' : 's'}`"
        @click="emit('select', day)"
        @dragover="onDragOver($event, day)"
        @dragleave="overDay === day && (overDay = null)"
        @drop.prevent="onDrop(day)"
      >
        <span>{{ weekday(day) }}</span>
        <span class="text-base font-semibold" :class="day === today ? '' : 'text-fg'">
          {{ dayOfMonth(day) }}
        </span>
        <span
          class="size-1.5 rounded-full"
          :class="counts[day] ? 'bg-brand-500' : 'bg-transparent'"
          aria-hidden="true"
        />
      </button>
    </li>
  </ol>
</template>
