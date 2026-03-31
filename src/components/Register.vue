<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-2">
    <div
      class="bg-white py-3 px-3 rounded-xl min-h-36 max-w-sm w-full gap-3 flex flex-col items-center"
    >
      <img class="h-20 w-auto" :src="logo" alt="Vue Jobs" />
      <h2 class="font-bold text-green-700 text-3xl">REGISTRATION FORM</h2>
      <input
        type="email"
        v-model="email"
        class="border border-gray-300 rounded-xl px-1.5 py-1 shadow-xs w-full"
        placeholder="email"
      />
      <input
        type="password"
        v-model="password"
        class="border border-gray-300 rounded-xl px-1.5 py-1 shadow-xs w-full"
        placeholder="password"
      />
      <button
        class="bg-green-600 rounded-2xl px-1.5 font-bold text-white w-full h-10 text-xl hover:bg-green-700"
        @click="submit"
        :disabled="isLoading"
      >
        Sign up
      </button>
      <p class="font-bold text-gray-400 text-sm">Your data is private</p>
    </div>
    <p v-if="errorMessage" class="text-red-700 text-xl">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import logo from "@/assets/bp.png";
import {ref} from "vue";
import { useAuth } from "@/composables/useAuth.ts";
import { useTasks } from "@/composables/useTasks.ts"
import { useRouter } from "vue-router";

const router = useRouter();
const { register } = useAuth();
const { importGuestTasks } = useTasks();
const email = ref<string>('');
const password = ref<string>('');
const errorMessage = ref<string>('');
const isLoading = ref<boolean>(false);

const submit = async () => {
  isLoading.value = true;
  errorMessage.value = "";
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
