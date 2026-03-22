<script setup>
import newsData from '@/news.json';
import NewListing from '@/components/NewListing.vue'
import { ref, defineProps } from 'vue';

defineProps({
    limit: Number,
    showButton: {
        type: Boolean,
        default: false
    }
})

const news = ref(newsData.news);
</script>

<template>
    <section class="px-4 py-10 w-full">
        <div class="mx-auto ">
          <h2 class="mb-6 text-center text-3xl font-bold text-green-500">
              Browse News
          </h2>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
              <NewListing v-for="newsItem in news.slice(0, limit || news.length)" :key="newsItem.id" :newsItem="newsItem"/>
          </div>
          <div v-if="showButton" class="mt-10 mb-2 flex justify-center min-w-2">
            <a
              href="jobs.html"
              class="block rounded-xl bg-black px-10 py-4 text-center font-bold text-white hover:bg-gray-700"
              >View All News</a
            >
          </div>
        </div>
    </section>
</template>
