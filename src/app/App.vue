<template>
  <div v-if="showChrome" class="flex min-h-screen flex-col bg-bg">
    <AppHeader />
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter v-if="!route.meta.app" />
  </div>
  <RouterView v-else />
</template>

<script setup lang="ts">
import AppHeader from "@/app/layout/AppHeader.vue";
import AppFooter from "@/app/layout/AppFooter.vue";
import { RouterView, useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();
const showChrome = computed(() => !route.meta.bare);
</script>
