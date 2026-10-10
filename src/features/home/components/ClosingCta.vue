<script setup lang="ts">
import { storeToRefs } from "pinia";
import BaseButton from "@/shared/ui/BaseButton.vue";
import { useAuthStore } from "@/features/auth/stores/authStore";

const { isRegistered } = storeToRefs(useAuthStore());
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 pt-8 pb-20 sm:px-6">
    <div class="rounded-3xl bg-tint-mint px-6 py-14 text-center sm:px-12">
      <h2 class="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
        Your list is one click away.
      </h2>
      <p class="mx-auto mt-3 max-w-md text-fg-muted">
        No download and no sign-up. Open TODOS and write down the first thing on your mind.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <BaseButton to="/todo" size="lg">
          {{ isRegistered ? "Open my tasks" : "Start for free" }}
        </BaseButton>
        <BaseButton v-if="!isRegistered" to="/register" variant="secondary" size="lg">
          Create an account
        </BaseButton>
      </div>
    </div>
  </section>
</template>
