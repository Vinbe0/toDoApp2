<script setup lang="ts">
import { ref } from "vue";
import BaseBadge from "@/components/ui/BaseBadge.vue";

export type Tip = {
  id: string;
  category: string;
  title: string;
  description: string;
  meta: string;
};

defineProps<{ tip: Tip }>();

const expanded = ref(false);
</script>

<template>
  <article class="flex flex-col rounded-2xl border border-border bg-surface p-6">
    <BaseBadge tone="brand" class="self-start">{{ tip.category }}</BaseBadge>
    <h3 class="mt-3 text-lg font-semibold text-fg">{{ tip.title }}</h3>
    <p class="mt-2 flex-1 text-sm text-fg-muted" :class="!expanded && 'line-clamp-2'">
      {{ tip.description }}
    </p>
    <div class="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
      <span class="text-fg-subtle">{{ tip.meta }}</span>
      <button
        type="button"
        class="font-semibold text-brand-600 hover:text-brand-700"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? "Show less" : "Read more" }}
      </button>
    </div>
  </article>
</template>
