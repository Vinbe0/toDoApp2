<script setup lang="ts">
import tips from "@/features/home/data/tips.json";
import TipItem from "@/features/home/components/TipItem.vue";

const props = defineProps<{ limit?: number }>();
const visibleTips = props.limit ? tips.slice(0, props.limit) : tips;
</script>

<template>
  <section class="border-t border-border">
    <div
      class="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)]"
    >
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-fg">Productivity tips</h2>
        <p class="mt-2 text-fg-muted">A few techniques that work well with a task list.</p>
      </div>

      <ul class="divide-y divide-border border-y border-border">
        <TipItem v-for="tip in visibleTips" :key="tip.id" :tip="tip" />
      </ul>
    </div>
  </section>
</template>
