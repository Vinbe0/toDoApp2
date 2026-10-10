<script setup lang="ts">
import { useId } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  label?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
}>();

const model = defineModel<string>({ default: "" });
const id = useId();
</script>

<template>
  <div class="grid gap-1.5">
    <label v-if="label" :for="id" class="text-sm font-medium text-fg">{{ label }}</label>
    <div class="relative">
      <component
        :is="multiline ? 'textarea' : 'input'"
        :id="id"
        v-model="model"
        v-bind="$attrs"
        :aria-invalid="!!error"
        :aria-describedby="error || hint ? `${id}-msg` : undefined"
        class="w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg shadow-xs transition placeholder:text-fg-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none aria-[invalid=true]:border-red-500"
        :class="[multiline ? 'min-h-24 resize-y py-2' : 'h-10', $slots.trailing && 'pr-10']"
      />
      <div v-if="$slots.trailing" class="absolute inset-y-0 right-1.5 flex items-center">
        <slot name="trailing" />
      </div>
    </div>
    <p
      v-if="error || hint"
      :id="`${id}-msg`"
      class="text-xs"
      :class="error ? 'text-red-600' : 'text-fg-subtle'"
    >
      {{ error || hint }}
    </p>
  </div>
</template>
