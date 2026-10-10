<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-2 px-4">
    <form
      class="bg-white py-3 px-3 rounded-xl min-h-36 max-w-sm w-full gap-3 flex flex-col items-center"
      @submit.prevent="submit"
      novalidate
    >
      <AppLogo :size="64" :show-text="false" class="text-green-700" />
      <h1 class="font-bold text-green-700 text-3xl">LOG IN</h1>
      <label for="email" class="sr-only">Email</label>
      <input
        id="email"
        type="email"
        v-model.trim="email"
        autocomplete="email"
        required
        class="border border-gray-300 rounded-xl px-1.5 py-1 shadow-xs w-full"
        placeholder="email"
      />
      <label for="password" class="sr-only">Password</label>
      <input
        id="password"
        type="password"
        v-model="password"
        autocomplete="current-password"
        required
        minlength="1"
        class="border border-gray-300 rounded-xl px-1.5 py-1 shadow-xs w-full"
        placeholder="password"
      />
      <button
        type="submit"
        class="bg-green-600 rounded-2xl px-1.5 font-bold text-white w-full h-10 text-xl hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="isLoading"
      >
        {{ isLoading ? "Logging in…" : "Log In" }}
      </button>
      <p v-if="errorMessage" role="alert" class="text-red-700 text-sm font-semibold">{{ errorMessage }}</p>
      <p class="text-sm text-gray-600">
        Don't have an account?
        <RouterLink to="/register" class="font-bold text-green-700 hover:underline">Sign up</RouterLink>
      </p>
      <p class="font-bold text-gray-400 text-sm">Your data is private</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import AppLogo from "@/components/ui/AppLogo.vue";
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth.ts";
import { useRouter } from "vue-router";
import { useTasks } from "@/composables/useTasks.ts"

const router = useRouter();
const email = ref<string>('');
const password = ref<string>('');
const errorMessage = ref<string>('');
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

const submit = async() => {
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
  }
  catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Log In failed. Please try again";
  } finally {
    isLoading.value = false;
  }
}
</script>
