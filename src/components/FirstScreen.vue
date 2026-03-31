<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-2">
    <h2 class="font-bold text-white text-7xl">TODOS</h2>
    <div
      class="bg-white py-2 px-3 rounded-xl min-h-36 max-w-sm w-full gap-2 flex flex-col items-center"
    >
    <img class="h-20 w-auto" :src="logo" alt="Vue Jobs" />
      <p class="font-bold text-black text-xl">WELCOME TO OUR PLATFORM!</p>
      <RouterLink
        to="/login"
        class="bg-green-600 rounded-2xl px-1.5 font-bold text-white w-full h-10 text-center text-xl pt-1.5 hover:bg-green-700"
      >
        Log In
      </RouterLink>
      <div class="flex gap-2 w-full">
        <RouterLink to="/register" class="bg-green-600 rounded-2xl px-1.5 font-bold text-white text-center pt-1.5 flex-1 h-10 text-xl hover:bg-green-700">
            Register
        </RouterLink>
        <button
          @click="continueAsGuest"
          class="bg-gray-600 rounded-2xl px-1.5 font-bold text-white text-center pt-1.5 flex-1 h-10 text-xl hover:bg-gray-700"
        >
            Guest
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import logo from "@/assets/bp.png";
import { useRouter } from "vue-router";
import { enterGuestMode } from "@/composables/useAuth";

const router = useRouter();

const continueAsGuest = () => {
  enterGuestMode();
  router.push("/todo");
};
</script>
