<template>
  <AuthLayout title="Create your account" subtitle="Your guest tasks can be imported after signing up.">
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
        autocomplete="new-password"
        placeholder="••••••••"
        hint="At least 6 characters"
        required
      />
      <BaseButton type="submit" size="lg" block :loading="isLoading">Create account</BaseButton>
    </form>
    <p class="mt-6 text-center text-sm text-fg-muted">
      Already have an account?
      <RouterLink to="/login" class="font-semibold text-brand-600 hover:text-brand-700">Log in</RouterLink>
    </p>
    <p class="mt-2 text-center text-sm text-fg-muted">
      or <RouterLink to="/todo" class="font-semibold text-fg hover:underline">continue as a guest</RouterLink>
    </p>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from "@/components/auth/AuthLayout.vue";
import PasswordInput from "@/components/auth/PasswordInput.vue";
import BaseInput from "@/components/ui/BaseInput.vue";
import BaseButton from "@/components/ui/BaseButton.vue";
import { RouterLink } from "vue-router";
import {ref} from "vue";
import { useAuth } from "@/composables/useAuth";
import { useTasks } from "@/composables/useTasks"
import { useRouter } from "vue-router";

const router = useRouter();
const { register } = useAuth();
const { importGuestTasks } = useTasks();
const email = ref<string>('');
const password = ref<string>('');
const errorMessage = ref<string>('');
const isLoading = ref<boolean>(false);

const validate = () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    return "Please enter a valid email address";
  }
  if (password.value.length < 6) {
    return "Password must be at least 6 characters";
  }
  return "";
};

const submit = async () => {
  errorMessage.value = validate();
  if (errorMessage.value) return;
  isLoading.value = true;
  try {
    await register(email.value, password.value);
    try {
      await importGuestTasks();
    } catch {
      // Registration succeeded even if guest import fails.
    }
    router.push("/account");
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Registration failed. Please try again";
  }
  finally {
    isLoading.value = false;
  }
}


</script>
