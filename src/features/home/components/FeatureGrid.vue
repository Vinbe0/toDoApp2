<script setup lang="ts">
const features = [
  {
    title: "Priorities and deadlines",
    text: "Mark what matters. Overdue tasks turn red so they don't slip by.",
  },
  {
    title: "Labels and filters",
    text: "Tag tasks as work, shopping or university, then combine filters: search active work tasks sorted by deadline, for example.",
  },
  {
    title: "Your own order",
    text: "Drag tasks into the order you'll actually do them in. The order is saved.",
  },
  {
    title: "Search",
    text: "Find a task by title as you type.",
  },
  {
    title: "No account needed",
    text: "Guest tasks are kept in your browser, so you can start right away.",
  },
  {
    title: "Sync when you want it",
    text: "Sign up to store tasks on the server; your guest tasks come with you.",
  },
];
</script>

<template>
  <section
    class="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)]"
  >
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-fg">What it does</h2>
      <p class="mt-2 text-fg-muted">The essentials, nothing more.</p>
    </div>

    <dl class="grid gap-x-10 sm:grid-cols-2">
      <div v-for="feature in features" :key="feature.title" class="border-t border-border py-5">
        <dt class="font-semibold text-fg">{{ feature.title }}</dt>
        <dd class="mt-1 text-sm leading-relaxed text-fg-muted">{{ feature.text }}</dd>
      </div>
    </dl>
  </section>
</template>
