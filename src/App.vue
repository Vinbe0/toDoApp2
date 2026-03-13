<template>
  <Navbar />
  <ToDoApp />
</template>

<script setup>
  import bgwebImage from "@/assets/bgweb.jpg";
  import Navbar from '@/components/Navbar.vue';
  import ToDoApp from '@/components/ToDoApp.vue';
  import { RouterView } from 'vue-router';
</script>
