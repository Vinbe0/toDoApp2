<script setup>
    import bgwebImage from "@/assets/bgweb.jpg";
    import Hero from '@/components/Hero.vue';
    import HomeCards from '@/components/HomeCards.vue';
    import NewsListings from '@/components/NewsListings.vue';
</script>

<template>
    <Hero />    
    <HomeCards />
    <NewsListings limit='3' :showButton='true'/>
</template>