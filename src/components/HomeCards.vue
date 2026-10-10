<template>
    <section class="py-4">
      <div class="container-xl lg:container m-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg">
          <div class="bg-gray-100 p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold">For Base Users</h2>
            <p class="mt-2 mb-4">
              Start planning your day efficiently
            </p>
            <RouterLink
              to="/first"
              class="inline-block bg-black text-white rounded-lg px-4 py-2 hover:bg-gray-700"
            >
              Add Tasks
            </RouterLink>
          </div>
          <div class="bg-green-100 p-6 rounded-lg shadow-md">
            <h2 class="text-2xl font-bold">For Advanced Users</h2>
            <p class="mt-2 mb-4">
              Sign up to sync your tasks across devices
            </p>
            <RouterLink
              to="/register"
              class="inline-block bg-green-500 text-white rounded-lg px-4 py-2 hover:bg-green-600"
            >
              Create Account
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
</template>