<script setup lang="ts">
import { onMounted, ref } from "vue";
import { labelTextColor } from "@/features/tasks/components/taskDisplay";
import { MAX_LABEL_NAME_LENGTH } from "@/features/tasks/model/label";
import type { LabelColor } from "@/features/tasks/model/types";

const props = defineProps<{
  initial?: string;
  color: LabelColor;
  /** Saves the name; the field closes only when this resolves to true. */
  save: (name: string) => Promise<boolean>;
}>();
const emit = defineEmits<{ done: [] }>();

const value = ref(props.initial ?? "");
const input = ref<HTMLInputElement | null>(null);
const saving = ref(false);
/** Set once the field is done, so the blur that follows Enter doesn't save again. */
const finished = ref(false);

onMounted(() => {
  input.value?.focus();
  input.value?.select();
});

function finish() {
  finished.value = true;
  emit("done");
}

async function submit() {
  if (saving.value || finished.value) return;
  if (!value.value.trim()) return finish();
  saving.value = true;
  try {
    if (await props.save(value.value)) finish();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form class="flex items-center gap-2.5 rounded-md px-2 py-1" @submit.prevent="submit">
    <span :class="['w-5 text-center font-semibold', labelTextColor[color]]" aria-hidden="true"
      >#</span
    >
    <input
      ref="input"
      v-model="value"
      :maxlength="MAX_LABEL_NAME_LENGTH"
      aria-label="Label name"
      placeholder="Label name"
      class="min-w-0 flex-1 rounded border border-brand-500 bg-surface px-1.5 py-0.5 text-sm text-fg focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      @keydown.esc.prevent="finish"
      @blur="submit"
    />
  </form>
</template>
