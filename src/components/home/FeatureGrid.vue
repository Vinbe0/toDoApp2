<script setup lang="ts">
const features = [
  { icon: "pi-flag", title: "Priorities & deadlines", text: "Mark what matters and see overdue tasks at a glance." },
  { icon: "pi-tags", title: "Labels & filters", text: "Group tasks by label and filter by status, date or priority." },
  { icon: "pi-arrows-v", title: "Drag & drop", text: "Reorder your list exactly the way you want to work through it." },
  { icon: "pi-search", title: "Instant search", text: "Find any task by title as you type." },
  { icon: "pi-user", title: "Guest mode", text: "Try everything without an account — tasks stay in your browser." },
  { icon: "pi-cloud", title: "Account sync", text: "Sign up to save tasks on the server and import your guest tasks." },
];
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 py-16 sm:px-6">
    <div class="mb-10 max-w-2xl">
      <h2 class="text-3xl font-bold tracking-tight text-fg">Everything you need, nothing you don't</h2>
      <p class="mt-2 text-fg-muted">A focused set of tools to keep your day under control.</p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="feature in features"
        :key="feature.title"
        class="rounded-2xl border border-border bg-surface p-6 transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <span class="mb-4 grid size-10 place-items-center rounded-xl bg-brand-500/10 text-brand-600">
          <i :class="['pi', feature.icon]" aria-hidden="true" />
        </span>
        <h3 class="font-semibold text-fg">{{ feature.title }}</h3>
        <p class="mt-1 text-sm text-fg-muted">{{ feature.text }}</p>
      </div>
    </div>
  </section>
</template>
