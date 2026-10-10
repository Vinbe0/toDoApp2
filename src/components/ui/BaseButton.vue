<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    variant?: Variant;
    size?: Size;
    to?: RouteLocationRaw;
    type?: "button" | "submit" | "reset";
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
  }>(),
  { variant: "primary", size: "md", type: "button" },
);

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700",
  secondary: "border border-border bg-surface text-fg shadow-sm hover:bg-surface-muted",
  ghost: "text-fg-muted hover:bg-surface-muted hover:text-fg",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2 px-6 text-base",
};

const classes = computed(() => [
  "inline-flex items-center justify-center rounded-xl font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
  variants[props.variant],
  sizes[props.size],
  props.block && "w-full",
]);
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <slot />
  </RouterLink>
  <button v-else :type="type" :class="classes" :disabled="disabled || loading">
    <i v-if="loading" class="pi pi-spin pi-spinner" aria-hidden="true" />
    <slot />
  </button>
</template>
