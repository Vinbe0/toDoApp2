<script setup lang="ts">
import Hero from "@/components/home/Hero.vue";
import FeatureGrid from "@/components/home/FeatureGrid.vue";
import TipsSection from "@/components/home/TipsSection.vue";
</script>

<template>
  <Hero />
  <FeatureGrid />
  <TipsSection :limit="3" />
</template>
