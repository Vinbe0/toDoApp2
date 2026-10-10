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
import AuthLayout from "@/features/auth/components/AuthLayout.vue";
import PasswordInput from "@/features/auth/components/PasswordInput.vue";
import BaseInput from "@/shared/ui/BaseInput.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import { ref } from "vue";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { safeRedirect } from "@/app/router/guards";
import { useTasksStore } from "@/features/tasks/stores/tasksStore";
import { notify } from "@/shared/lib/notify";

const router = useRouter();
const route = useRoute();
const email = ref<string>("");
const password = ref<string>("");
const errorMessage = ref<string>("");
const isLoading = ref<boolean>(false);
const auth = useAuthStore();
const tasksStore = useTasksStore();

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
    await auth.login(email.value, password.value);
    try {
      const imported = await tasksStore.importGuestTasks((count) =>
        window.confirm(`Import ${count} task(s) from guest mode into your account?`),
      );
      if (imported) notify.success(`Imported ${imported} task(s) into your account`);
    } catch {
      // Login succeeded even if guest import fails.
    }
    await router.push(safeRedirect(route.query.redirect));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Log In failed. Please try again";
  } finally {
    isLoading.value = false;
  }
};
</script>
