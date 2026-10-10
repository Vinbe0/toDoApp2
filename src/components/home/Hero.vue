<script setup lang="ts">
import BaseButton from "@/components/ui/BaseButton.vue";
import BaseBadge from "@/components/ui/BaseBadge.vue";
import { useAuth } from "@/composables/useAuth";

const { isRegistered } = useAuth();

const previewTasks = [
  { text: "Finish portfolio README", priority: "High", tone: "red", done: true },
  { text: "Review pull request", priority: "Medium", tone: "amber", done: false },
  { text: "Plan next sprint", priority: "Low", tone: "blue", done: false },
] as const;
</script>

<template>
  <section class="relative overflow-hidden border-b border-border bg-surface">
    <div
      class="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-brand-400/20 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-2"
    >
      <div>
        <BaseBadge tone="brand" class="mb-4">Free · No sign-up required</BaseBadge>
        <h1 class="text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
          Plan your day. <span class="text-brand-600">Get it done.</span>
        </h1>
        <p class="mt-4 max-w-lg text-lg text-fg-muted">
          TODOS keeps your tasks organized with priorities, deadlines and labels. Start as a guest
          in seconds, or create an account to keep your tasks synced.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <BaseButton to="/todo" size="lg">
            {{ isRegistered ? "Open my tasks" : "Start planning" }}
            <i class="pi pi-arrow-right" aria-hidden="true" />
          </BaseButton>
          <BaseButton v-if="!isRegistered" to="/register" variant="secondary" size="lg">
            Create account
          </BaseButton>
        </div>
      </div>

      <div
        class="rounded-2xl border border-border bg-bg p-4 shadow-xl shadow-brand-900/5"
        aria-hidden="true"
      >
        <div class="mb-3 flex items-center justify-between px-1">
          <p class="font-semibold text-fg">Today</p>
          <p class="text-xs text-fg-subtle">2 active · 1 completed</p>
        </div>
        <ul class="grid gap-2">
          <li
            v-for="task in previewTasks"
            :key="task.text"
            class="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
          >
            <span
              class="grid size-5 place-items-center rounded-full border-2"
              :class="task.done ? 'border-brand-600 bg-brand-600 text-white' : 'border-border'"
            >
              <i v-if="task.done" class="pi pi-check text-[10px]" />
            </span>
            <span
              class="flex-1 text-sm font-medium"
              :class="task.done && 'text-fg-subtle line-through'"
            >
              {{ task.text }}
            </span>
            <BaseBadge :tone="task.tone">{{ task.priority }}</BaseBadge>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
