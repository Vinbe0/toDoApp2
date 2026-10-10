<script setup lang="ts">
import AuthLayout from "@/features/auth/components/AuthLayout.vue";
import CredentialsForm from "@/features/auth/components/CredentialsForm.vue";
</script>

<template>
  <AuthLayout
    title="Create your account"
    subtitle="Your guest tasks can be imported after signing up."
  >
    <CredentialsForm mode="register" />
  </AuthLayout>
</template>
