<script setup lang="ts">
import ProductShot from "@/features/home/components/ProductShot.vue";

defineProps<{
  eyebrow: string;
  title: string;
  text: string;
  tint: "mint" | "cream" | "peach";
  /** Put the visual on the left instead of the right (on wide screens). */
  reverse?: boolean;
}>();
</script>

<template>
  <section class="grid items-center gap-8 py-12 lg:grid-cols-2 lg:gap-16">
    <div :class="reverse && 'lg:order-2'">
      <p class="text-sm font-semibold text-brand-700 dark:text-brand-300">{{ eyebrow }}</p>
      <h2 class="mt-2 text-3xl font-semibold tracking-tight text-fg">{{ title }}</h2>
      <p class="mt-3 max-w-md leading-relaxed text-fg-muted">{{ text }}</p>
    </div>
    <ProductShot :tint="tint">
      <slot />
    </ProductShot>
  </section>
</template>
