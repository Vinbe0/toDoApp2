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
    <section class="px-4 py-10">
        <div class="container-xl lg:container m-auto">
            <h2 class="text-3xl font-bold text-green-500 mb-6 text-center">
                Browse News
            </h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NewListing v-for="newsItem in news.slice(0, limit || news.length)" :key="newsItem.id" :newsItem="newsItem"/>
        </div>
    </section>

    <section v-if="showButton" class="m-auto max-w-lg my-10 px-6">
      <a
        href="jobs.html"
        class="block bg-black text-white text-center py-4 px-6 rounded-xl hover:bg-gray-700"
        >View All News</a
      >
    </section>
</template>
