<template>
  <section class="min-h-[calc(100dvh-5rem)] flex items-center justify-center p-6">
    <div class="bg-white rounded-2xl shadow-md p-8 text-center max-w-sm w-full">
      <h1 class="text-6xl font-extrabold text-green-700">404</h1>
      <p class="mt-2 mb-6 text-lg text-gray-700">This page doesn't exist.</p>
      <RouterLink
        to="/"
        class="inline-block bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl px-6 py-2"
      >
        Back to home
      </RouterLink>
    </div>
  </section>
</template>
