<script setup lang="ts">
import BaseCard from "@/shared/ui/BaseCard.vue";

// Plain facts about what this app stores. Keep in sync with the code
// (storage keys in features/*, server schema in server/src/infrastructure/db).
const sections: Array<{ title: string; items: string[] }> = [
  {
    title: "Guest mode",
    items: [
      "Your tasks and labels are saved only in this browser's local storage. They are sent to a server only if you sign up and agree to import them.",
      "Clearing this site's data in your browser deletes them.",
    ],
  },
  {
    title: "With an account",
    items: [
      "The server stores your email address, your password as a bcrypt hash (never the password itself), and your tasks and labels.",
      "The server is whatever instance you or the person running this demo started. It is often a database on their own computer.",
      "After you log in, the browser keeps a sign-in token (valid for 7 days) and your email in local storage. Logging out removes them.",
      "There is no account deletion in the app yet; whoever runs the server can remove an account, which also removes its tasks and labels.",
    ],
  },
  {
    title: "Everything else",
    items: [
      "No analytics, tracking or advertising, and no cookies.",
      "The only third-party request is for the Inter font from Google Fonts, which means Google can see your IP address when the page loads.",
      "Your light/dark theme choice is saved in local storage.",
    ],
  },
];
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
    <h1 class="text-3xl font-bold tracking-tight text-fg">Privacy</h1>
    <p class="mt-2 text-fg-muted">
      TODOS is a portfolio project, not a commercial service. This page describes exactly what the
      app stores and where.
    </p>

    <BaseCard class="mt-8 grid gap-8">
      <section v-for="section in sections" :key="section.title">
        <h2 class="font-semibold text-fg">{{ section.title }}</h2>
        <ul class="mt-2 grid list-disc gap-1.5 pl-5 text-sm leading-relaxed text-fg-muted">
          <li v-for="item in section.items" :key="item">{{ item }}</li>
        </ul>
      </section>
    </BaseCard>
  </div>
</template>
