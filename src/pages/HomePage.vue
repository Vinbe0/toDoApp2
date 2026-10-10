<script setup lang="ts">
import Hero from "@/features/home/components/Hero.vue";
import FeatureGrid from "@/features/home/components/FeatureGrid.vue";
import TipsSection from "@/features/home/components/TipsSection.vue";
</script>

<template>
  <Hero />
  <FeatureGrid />
  <TipsSection :limit="3" />
</template>
