<template>
  <AuthLayout title="Welcome back" subtitle="Log in to see your synced tasks.">
    <form class="grid gap-4" novalidate @submit.prevent="submit">
      <div
        v-if="errorMessage"
        role="alert"
        class="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
      >
        <i class="pi pi-exclamation-circle mt-0.5" aria-hidden="true" />
        {{ errorMessage }}
      </div>
      <BaseInput
        v-model.trim="email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@example.com"
        required
      />
      <PasswordInput
        v-model="password"
        label="Password"
        autocomplete="current-password"
        placeholder="••••••••"
        required
      />
      <BaseButton type="submit" size="lg" block :loading="isLoading">Log in</BaseButton>
    </form>
    <p class="mt-6 text-center text-sm text-fg-muted">
      Don't have an account?
      <RouterLink to="/register" class="font-semibold text-brand-600 hover:text-brand-700"
        >Sign up</RouterLink
      >
    </p>
    <p class="mt-2 text-center text-sm text-fg-muted">
      or
      <RouterLink to="/todo" class="font-semibold text-fg hover:underline"
        >continue as a guest</RouterLink
      >
    </p>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from "@/components/auth/AuthLayout.vue";
import PasswordInput from "@/components/auth/PasswordInput.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { RouterLink } from "vue-router";
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";
import { useTasks } from "@/composables/useTasks";

const router = useRouter();
const email = ref<string>("");
const password = ref<string>("");
const errorMessage = ref<string>("");
const isLoading = ref<boolean>(false);
const { login } = useAuth();
const { importGuestTasks } = useTasks();

const validate = () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    return "Please enter a valid email address";
  }
  if (password.value.length < 1) {
    return "Please enter your password";
  }
  return "";
};

const submit = async () => {
  errorMessage.value = validate();
  if (errorMessage.value) return;
  isLoading.value = true;
  try {
    await login(email.value, password.value);
    try {
      await importGuestTasks();
    } catch {
      // Login succeeded even if guest import fails.
    }
    router.push("/account");
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Log In failed. Please try again";
  } finally {
    isLoading.value = false;
  }
};
</script>
