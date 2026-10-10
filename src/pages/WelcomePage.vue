<template>
  <AuthLayout title="Welcome to TODOS" subtitle="How would you like to get started?">
    <div class="grid gap-3">
      <BaseButton to="/login" size="lg" block>Log in</BaseButton>
      <BaseButton to="/register" variant="secondary" size="lg" block>Create account</BaseButton>
      <div class="my-2 flex items-center gap-3 text-xs text-fg-subtle">
        <span class="h-px flex-1 bg-border" /> or <span class="h-px flex-1 bg-border" />
      </div>
      <BaseButton variant="ghost" size="lg" block @click="continueAsGuest">
        Continue as guest <i class="pi pi-arrow-right" aria-hidden="true" />
      </BaseButton>
      <p class="text-center text-xs text-fg-subtle">Guest tasks are stored only in this browser.</p>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import AuthLayout from "@/features/auth/components/AuthLayout.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import { useAuthStore } from "@/features/auth/stores/authStore";

const router = useRouter();
const auth = useAuthStore();

const continueAsGuest = () => {
  auth.logout();
  router.push("/todo");
};
</script>
