<script setup lang="ts">
import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseBadge from "@/shared/ui/BaseBadge.vue";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { storeToRefs } from "pinia";

const { isRegistered } = storeToRefs(useAuthStore());

const previewTasks = [
  {
    text: "Submit the lab report",
    meta: "Overdue · yesterday",
    priority: "High",
    tone: "red",
    done: false,
  },
  {
    text: "Review pull request #4",
    meta: "Due today",
    priority: "Medium",
    tone: "amber",
    done: false,
  },
  { text: "Buy coffee beans", meta: "#Shopping", priority: "Low", tone: "blue", done: false },
  { text: "Set up the project", meta: "#Work", priority: "Medium", tone: "amber", done: true },
] as const;
</script>

<template>
  <section class="border-b border-border bg-surface">
    <div
      class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-20 lg:grid-cols-[1fr_28rem]"
    >
      <div>
        <h1 class="max-w-xl text-4xl font-bold tracking-tight text-fg sm:text-5xl">
          A to-do list that stays out of your way.
        </h1>
        <p class="mt-5 max-w-lg text-lg leading-relaxed text-fg-muted">
          Write tasks down, give them a deadline and a priority, and see what's due first. No
          account needed: your list lives in the browser until you decide to sign up.
        </p>
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <BaseButton to="/todo" size="lg">
            {{ isRegistered ? "Open my tasks" : "Start a list" }}
          </BaseButton>
          <BaseButton v-if="!isRegistered" to="/login" variant="ghost" size="lg">
            I have an account
          </BaseButton>
        </div>
      </div>

      <!-- Static example styled like the real task list. -->
      <div class="rounded-xl border border-border bg-bg" aria-hidden="true">
        <div class="flex items-center justify-between border-b border-border px-4 py-3">
          <p class="text-sm font-semibold text-fg">My tasks</p>
          <p class="text-xs text-fg-subtle">3 active · 1 completed</p>
        </div>
        <ul class="divide-y divide-border">
          <li
            v-for="task in previewTasks"
            :key="task.text"
            class="flex items-start gap-3 px-4 py-3"
          >
            <span
              class="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border-2"
              :class="task.done ? 'border-fg-subtle bg-fg-subtle text-bg' : 'border-fg-subtle'"
            >
              <i v-if="task.done" class="pi pi-check text-[8px]" />
            </span>
            <div class="min-w-0 flex-1">
              <p
                class="text-sm font-medium text-fg"
                :class="task.done && 'text-fg-subtle line-through'"
              >
                {{ task.text }}
              </p>
              <p
                class="mt-0.5 text-xs"
                :class="task.meta.startsWith('Overdue') ? 'text-red-600' : 'text-fg-subtle'"
              >
                {{ task.meta }}
              </p>
            </div>
            <BaseBadge :tone="task.tone">{{ task.priority }}</BaseBadge>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
