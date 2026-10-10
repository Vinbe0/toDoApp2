<script setup lang="ts">
import { RouterLink } from "vue-router";
import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseInput from "@/shared/ui/BaseInput.vue";
import PasswordInput from "@/features/auth/components/PasswordInput.vue";
import { useAuthForm } from "@/features/auth/composables/useAuthForm";
import { MIN_PASSWORD_LENGTH, type AuthMode } from "@/features/auth/model/validation";

const props = defineProps<{ mode: AuthMode }>();

const { values, errors, formError, isSubmitting, submit } = useAuthForm(props.mode);

const copy = {
  login: {
    submit: "Log in",
    autocomplete: "current-password",
    hint: undefined,
    switchText: "Don't have an account?",
    switchLink: { name: "register" },
    switchLabel: "Sign up",
  },
  register: {
    submit: "Create account",
    autocomplete: "new-password",
    hint: `At least ${MIN_PASSWORD_LENGTH} characters`,
    switchText: "Already have an account?",
    switchLink: { name: "login" },
    switchLabel: "Log in",
  },
}[props.mode];
</script>

<template>
  <form class="grid gap-4" novalidate @submit.prevent="submit">
    <div
      v-if="formError"
      role="alert"
      class="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300"
    >
      <i class="pi pi-exclamation-circle mt-0.5" aria-hidden="true" />
      {{ formError }}
    </div>
    <BaseInput
      v-model="values.email"
      label="Email"
      type="email"
      autocomplete="email"
      placeholder="you@example.com"
      :error="errors.email"
      required
    />
    <PasswordInput
      v-model="values.password"
      label="Password"
      :autocomplete="copy.autocomplete"
      placeholder="••••••••"
      :hint="copy.hint"
      :error="errors.password"
      required
    />
    <BaseButton type="submit" size="lg" block :loading="isSubmitting">{{ copy.submit }}</BaseButton>
  </form>

  <p class="mt-6 text-center text-sm text-fg-muted">
    {{ copy.switchText }}
    <RouterLink :to="copy.switchLink" class="font-semibold text-brand-600 hover:text-brand-700">
      {{ copy.switchLabel }}
    </RouterLink>
  </p>
  <p class="mt-2 text-center text-sm text-fg-muted">
    or
    <RouterLink :to="{ name: 'tasks' }" class="font-semibold text-fg hover:underline">
      continue as a guest
    </RouterLink>
  </p>
</template>
