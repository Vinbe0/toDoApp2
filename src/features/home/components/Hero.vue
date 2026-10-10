<script setup lang="ts">
import { storeToRefs } from "pinia";
import BaseButton from "@/shared/ui/BaseButton.vue";
import AppPreview from "@/features/home/components/AppPreview.vue";
import ProductShot from "@/features/home/components/ProductShot.vue";
import { useAuthStore } from "@/features/auth/stores/authStore";

const { isRegistered } = storeToRefs(useAuthStore());
</script>

<template>
  <section class="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 md:pt-20">
    <div class="max-w-2xl">
      <h1
        class="text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.02em] text-fg sm:text-6xl"
      >
        Get it out of your head and onto a list.
      </h1>
      <p class="mt-5 max-w-xl text-lg leading-relaxed text-fg-muted">
        TODOS keeps track of what's due, what matters most and what can wait. Start right away in
        your browser; create an account when you want your list everywhere.
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <BaseButton to="/todo" size="lg">
          {{ isRegistered ? "Open my tasks" : "Start for free" }}
        </BaseButton>
        <span v-if="!isRegistered" class="text-sm text-fg-subtle">No sign-up needed</span>
      </div>
    </div>

    <ProductShot tint="mint" class="mt-12">
      <AppPreview />
    </ProductShot>
  </section>
</template>
