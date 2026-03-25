<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-2">
    <div
      class="bg-white py-3 px-3 rounded-xl min-h-36 max-w-sm w-full gap-3 flex flex-col items-center"
    >
      <img class="h-20 w-auto" :src="logo" alt="Vue Jobs" />
      <h2 class="font-bold text-green-700 text-3xl">REGISTRATION FORM</h2>
      <input
        class="border border-gray-300 rounded-xl px-1.5 py-1 shadow-xs w-full"
        placeholder="email"
      />
      <input
        class="border border-gray-300 rounded-xl px-1.5 py-1 shadow-xs w-full"
        placeholder="password"
      />
      <button
        class="bg-green-600 rounded-2xl px-1.5 font-bold text-white w-full h-10 text-xl hover:bg-green-700"
      >
        Sign up
      </button>
      <p class="font-bold text-gray-400 text-sm">Your data is private</p>
    </div>
  </div>
</template>

<script setup>
import logo from "@/assets/bp.png";
</script>
