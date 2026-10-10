<script setup lang="ts">
import BaseButton from "@/shared/ui/BaseButton.vue";
import EmptyState from "@/shared/ui/EmptyState.vue";
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-24">
    <EmptyState
      icon="pi-compass"
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    >
      <BaseButton to="/" class="mt-4">Back to home</BaseButton>
    </EmptyState>
  </div>
</template>
