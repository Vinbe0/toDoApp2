<script setup lang="ts">
import AuthLayout from "@/features/auth/components/AuthLayout.vue";
import CredentialsForm from "@/features/auth/components/CredentialsForm.vue";
</script>

<template>
  <AuthLayout title="Welcome back" subtitle="Log in to see your synced tasks.">
    <CredentialsForm mode="login" />
  </AuthLayout>
</template>
