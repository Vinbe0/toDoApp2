<template>
  <div v-if="showNavbar" class="flex min-h-screen flex-col bg-bg">
    <Navbar />
    <main class="flex-1">
      <RouterView />
    </main>
    <AppFooter />
  </div>
  <RouterView v-else />
</template>

<script setup lang="ts">
import Navbar from "@/components/Navbar.vue";
import AppFooter from "@/components/AppFooter.vue";
import { RouterView, useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();
const showNavbar = computed(() => route.meta.showNavbar !== false);
</script>
