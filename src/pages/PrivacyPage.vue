<script setup lang="ts">
import BaseCard from "@/shared/ui/BaseCard.vue";

const sections: Array<{ title: string; intro?: string; items?: string[] }> = [
  {
    title: "Information we collect",
    intro:
      "We collect information you provide, information collected automatically, and information from third parties.",
    items: [
      "Personal identifiers: email address, username and profile settings.",
      "User-generated content: task titles, descriptions, due dates, tags and attachments.",
      "Technical data: IP address, browser version, device type and time zone.",
      "Usage logs: features used and session duration, to help us make the app more intuitive.",
    ],
  },
  {
    title: "Legal basis for processing (GDPR)",
    intro: "If you use TODOS from the European Economic Area, we process your data based on:",
    items: [
      "Contractual necessity: to provide the service you signed up for.",
      "Consent: when you opt in to marketing or specific tracking.",
      "Legitimate interests: to improve the platform and keep it secure.",
    ],
  },
  {
    title: "Third-party service providers",
    intro: "We share limited data with trusted partners to keep TODOS running:",
    items: [
      "Infrastructure: cloud hosting (e.g. AWS or Google Cloud).",
      "Analytics: app performance monitoring (e.g. Plausible or Google Analytics).",
      "Communication: email providers for password resets.",
    ],
  },
  {
    title: "Data retention & deletion",
    items: [
      "Retention: we keep your data as long as your account is active.",
      "Deactivation: accounts inactive for more than 24 months may be archived or deleted.",
      "Deletion: deleting your account removes your data from our primary databases within 30 days; backups are overwritten within a further 60 days.",
    ],
  },
  {
    title: "International data transfers",
    intro:
      "Your information may be processed in countries whose data-protection laws differ from yours. We use Standard Contractual Clauses (SCCs) to keep it protected.",
  },
  {
    title: "Children's privacy",
    intro:
      "TODOS is not intended for children under 13 (or 16 in some jurisdictions). If we learn we have collected such data, we delete it immediately.",
  },
  {
    title: "Security measures",
    items: [
      "Encryption: SSL/TLS in transit and AES-256 at rest.",
      "Access control: only a small number of authorized staff can access server logs.",
      "Vulnerability scans: we regularly audit our code for security flaws.",
    ],
  },
  {
    title: "Your privacy rights",
    items: [
      "Right to know: request a summary of the data we hold about you.",
      "Right to portability: export your tasks as JSON or CSV.",
      "Right to object: opt out of non-essential data collection.",
    ],
  },
  {
    title: "Contact",
    intro: "The data controller is TODOS Inc. Email: privacy@todos-app.com",
  },
];
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10 sm:px-6">
    <h1 class="text-3xl font-bold tracking-tight text-fg">Privacy policy</h1>
    <p class="mt-2 text-fg-muted">
      We are committed to protecting your personal information. This policy covers our data
      practices across the TODOS web application and associated services.
    </p>

    <BaseCard class="mt-8 grid gap-8">
      <section v-for="(section, index) in sections" :key="section.title">
        <h2 class="font-semibold text-fg">{{ index + 1 }}. {{ section.title }}</h2>
        <p v-if="section.intro" class="mt-2 text-sm leading-relaxed text-fg-muted">
          {{ section.intro }}
        </p>
        <ul
          v-if="section.items"
          class="mt-2 grid list-disc gap-1.5 pl-5 text-sm leading-relaxed text-fg-muted"
        >
          <li v-for="item in section.items" :key="item">{{ item }}</li>
        </ul>
      </section>
    </BaseCard>
  </div>
</template>
