<script setup lang="ts">
import { computed, useAttrs, useId, type HTMLAttributes } from "vue";

defineOptions({ inheritAttrs: false });

defineProps<{
  label?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
}>();

const model = defineModel<string>({ default: "" });
const id = useId();

// `class` and `style` style the wrapper; every other attribute goes to the control.
const attrs = useAttrs();
const wrapperAttrs = computed(
  () => ({ class: attrs.class, style: attrs.style }) as HTMLAttributes,
);
const controlAttrs = computed(() => {
  const { class: _class, style: _style, ...rest } = attrs;
  return rest;
});

const controlClass =
  "w-full rounded-xl border border-border bg-surface px-3 text-sm text-fg shadow-xs transition placeholder:text-fg-subtle focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none aria-[invalid=true]:border-red-500";
</script>

<template>
  <div class="grid gap-1.5" v-bind="wrapperAttrs">
    <label v-if="label" :for="id" class="text-sm font-medium text-fg">{{ label }}</label>
    <div class="relative">
      <textarea
        v-if="multiline"
        :id="id"
        v-model="model"
        v-bind="controlAttrs"
        :aria-invalid="!!error"
        :aria-describedby="error || hint ? `${id}-msg` : undefined"
        :class="[controlClass, 'min-h-24 resize-y py-2']"
      />
      <input
        v-else
        :id="id"
        v-model="model"
        v-bind="controlAttrs"
        :aria-invalid="!!error"
        :aria-describedby="error || hint ? `${id}-msg` : undefined"
        :class="[controlClass, 'h-10', $slots.trailing && 'pr-10']"
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
