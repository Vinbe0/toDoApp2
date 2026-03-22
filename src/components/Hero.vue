<script setup>
    import { defineProps } from 'vue';
    defineProps({
        title: {
            type: String,
            default: 'THE BEST WEB APP FOR TASK PLANNING'
        },
        subtitle: {
            type: String,
            default: 'Try our product now absolutely for free'
        }

    })
</script>

<template>
    <section class="bg-green-700 py-20 mb-4 flex justify-center">
      <div
        class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8"
      >
        <div class="text-center max-w-4xl mx-auto">
          <h1
            class="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl"
          >
            {{ title }}
          </h1>
          <p class="my-4 text-xl text-white">
            {{ subtitle }}
          </p>
        </div>
      </div>
    </section>
</template>