<script setup>
    import Hero from '@/components/Hero.vue';
    import HomeCards from '@/components/HomeCards.vue';
    import NewsListings from '@/components/NewsListings.vue';
</script>

<template>
    <Hero />
    <HomeCards />
    <NewsListings :limit="3" />
</template>