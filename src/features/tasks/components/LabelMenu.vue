<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { labelSwatch } from "@/features/tasks/components/taskDisplay";
import { LABEL_COLORS } from "@/features/tasks/model/label";
import type { Label, LabelColor } from "@/features/tasks/model/types";

const props = defineProps<{ label: Label; openTaskCount: number }>();
const emit = defineEmits<{
  close: [];
  rename: [];
  recolor: [color: LabelColor];
  remove: [];
}>();

const root = ref<HTMLElement | null>(null);
/** Deleting asks for a second click instead of a browser dialog. */
const confirmingDelete = ref(false);

const onPointerDown = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) emit("close");
};
const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") emit("close");
};
onMounted(() => {
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("keydown", onKeydown);
  root.value?.querySelector<HTMLElement>("button")?.focus();
});
onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onPointerDown);
  document.removeEventListener("keydown", onKeydown);
});

const deleteHint = () =>
  props.openTaskCount
    ? `It will be removed from ${props.openTaskCount} open task${props.openTaskCount === 1 ? "" : "s"}.`
    : "No open tasks use it.";
</script>

<template>
  <div
    ref="root"
    class="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-border bg-surface p-2 text-sm shadow-lg"
    role="dialog"
    :aria-label="`Options for label ${label.name}`"
  >
    <button
      type="button"
      class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-fg-muted hover:bg-surface-muted hover:text-fg"
      @click="emit('rename')"
    >
      <i class="pi pi-pencil text-xs" aria-hidden="true" /> Rename
    </button>

    <p class="mt-2 px-2 text-xs font-semibold text-fg-subtle">Colour</p>
    <div class="mt-1.5 grid grid-cols-5 gap-1.5 px-2 pb-1">
      <button
        v-for="color in LABEL_COLORS"
        :key="color"
        type="button"
        class="grid size-7 place-items-center rounded-full ring-offset-2 ring-offset-surface transition"
        :class="[labelSwatch[color], label.color === color ? 'ring-2 ring-fg' : 'hover:scale-110']"
        :aria-label="`Colour ${color}`"
        :aria-pressed="label.color === color"
        @click="emit('recolor', color)"
      >
        <i
          v-if="label.color === color"
          class="pi pi-check text-[10px] text-white"
          aria-hidden="true"
        />
      </button>
    </div>

    <div class="mt-2 border-t border-border pt-2">
      <button
        v-if="!confirmingDelete"
        type="button"
        class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-red-600 hover:bg-red-500/10"
        @click="confirmingDelete = true"
      >
        <i class="pi pi-trash text-xs" aria-hidden="true" /> Delete
      </button>
      <div v-else class="px-2 py-1">
        <p class="text-xs text-fg-muted">Delete #{{ label.name }}? {{ deleteHint() }}</p>
        <div class="mt-2 flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
            @click="emit('remove')"
          >
            Delete label
          </button>
          <button
            type="button"
            class="flex-1 rounded-md border border-border px-2 py-1 text-xs text-fg-muted hover:bg-surface-muted"
            @click="confirmingDelete = false"
          >
            Keep
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
