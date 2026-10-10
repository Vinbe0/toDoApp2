<script setup lang="ts">
import Hero from "@/features/home/components/Hero.vue";
import FeatureStories from "@/features/home/components/FeatureStories.vue";
import TipsSection from "@/features/home/components/TipsSection.vue";
</script>

<template>
  <Hero />
  <FeatureStories />
  <TipsSection :limit="3" />
</template>
