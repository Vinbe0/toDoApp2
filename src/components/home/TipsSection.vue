<script setup lang="ts">
import tips from "@/data/tips.json";
import TipCard from "@/components/home/TipCard.vue";

const props = defineProps<{ limit?: number }>();
const visibleTips = props.limit ? tips.slice(0, props.limit) : tips;
</script>

<template>
  <section class="border-t border-border bg-surface/50">
    <div class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div class="mb-10 max-w-2xl">
        <h2 class="text-3xl font-bold tracking-tight text-fg">Productivity tips</h2>
        <p class="mt-2 text-fg-muted">Simple techniques to get more out of your task list.</p>
      </div>
      <div class="grid items-start gap-4 md:grid-cols-3">
        <TipCard v-for="tip in visibleTips" :key="tip.id" :tip="tip" />
      </div>
    </div>
  </section>
</template>
