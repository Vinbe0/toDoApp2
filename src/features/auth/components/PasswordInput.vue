<script setup lang="ts">
import { ref } from "vue";
import BaseInput from "@/shared/ui/BaseInput.vue";

defineOptions({ inheritAttrs: false });
defineProps<{ label?: string; error?: string; hint?: string }>();

const model = defineModel<string>({ default: "" });
const visible = ref(false);
</script>

<template>
  <BaseInput
    v-model="model"
    v-bind="$attrs"
    :label="label"
    :error="error"
    :hint="hint"
    :type="visible ? 'text' : 'password'"
  >
    <template #trailing>
      <button
        type="button"
        class="grid size-7 place-items-center rounded-lg text-fg-subtle hover:text-fg"
        :aria-label="visible ? 'Hide password' : 'Show password'"
        @click="visible = !visible"
      >
        <i :class="['pi', visible ? 'pi-eye-slash' : 'pi-eye']" aria-hidden="true" />
      </button>
    </template>
  </BaseInput>
</template>
