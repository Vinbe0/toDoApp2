<script setup lang="ts">
import { ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AppLogo from "@/shared/ui/AppLogo.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import ThemeToggle from "@/shared/theme/ThemeToggle.vue";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { storeToRefs } from "pinia";

const { isRegistered } = storeToRefs(useAuthStore());
const route = useRoute();
const menuOpen = ref(false);

watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
);

const links = [
  { to: "/", label: "Home", exact: true },
  { to: "/todo", label: "My Tasks" },
  { to: "/privacy", label: "Privacy" },
];

const linkClass =
  "rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg";
const activeClass = "!bg-brand-500/10 !text-brand-700 dark:!text-brand-300";
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
    <nav class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
      <RouterLink to="/" aria-label="TODOS home">
        <AppLogo />
      </RouterLink>

      <div class="hidden items-center gap-1 md:flex">
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="linkClass"
          :active-class="link.exact ? '' : activeClass"
          :exact-active-class="activeClass"
        >
          {{ link.label }}
        </RouterLink>
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <ThemeToggle />
        <BaseButton v-if="isRegistered" :to="{ name: 'account' }" variant="secondary" size="sm">
          <i class="pi pi-user" aria-hidden="true" /> Account
        </BaseButton>
        <template v-else>
          <BaseButton to="/login" variant="ghost" size="sm">Log in</BaseButton>
          <BaseButton to="/register" size="sm">Sign up</BaseButton>
        </template>
      </div>

      <div class="flex items-center gap-1 md:hidden">
        <ThemeToggle />
        <button
          type="button"
          class="rounded-lg p-2 text-fg-muted hover:bg-surface-muted"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <i :class="['pi', menuOpen ? 'pi-times' : 'pi-bars']" aria-hidden="true" />
        </button>
      </div>
    </nav>

    <div
      v-if="menuOpen"
      id="mobile-menu"
      class="grid gap-1 border-t border-border px-4 py-3 md:hidden"
    >
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        :class="linkClass"
        :active-class="link.exact ? '' : activeClass"
        :exact-active-class="activeClass"
      >
        {{ link.label }}
      </RouterLink>
      <div class="mt-2 flex gap-2">
        <BaseButton v-if="isRegistered" :to="{ name: 'account' }" variant="secondary" block>
          Account
        </BaseButton>
        <template v-else>
          <BaseButton to="/login" variant="secondary" class="flex-1">Log in</BaseButton>
          <BaseButton to="/register" class="flex-1">Sign up</BaseButton>
        </template>
      </div>
    </div>
  </header>
</template>
