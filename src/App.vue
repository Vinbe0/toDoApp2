<template>
  <Navbar v-if="showNavbar" />
  <RouterView />
</template>

<script setup>
import Navbar from "@/components/Navbar.vue";
import { RouterView, useRoute } from "vue-router";
import { computed } from "vue";

const route = useRoute();
const showNavbar = computed(() => route.meta.showNavbar !== false);
</script>
