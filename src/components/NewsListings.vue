<script setup>
import newsData from '@/news.json';
import NewListing from '@/components/NewListing.vue'
import { ref } from 'vue';

defineProps({
    limit: Number
})

const news = ref(newsData.news);
</script>

<template>
    <section class="px-4 py-10 w-full">
        <div class="mx-auto ">
          <h2 class="mb-6 text-center text-3xl font-bold text-green-500">
              Productivity Tips
          </h2>
          <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
              <NewListing v-for="newsItem in news.slice(0, limit || news.length)" :key="newsItem.id" :newsItem="newsItem"/>
          </div>
        </div>
    </section>
</template>
