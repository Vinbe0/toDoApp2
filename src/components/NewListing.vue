<script setup>
    import { defineProps, computed, ref } from 'vue';
    
    const props = defineProps({
        newsItem: Object
    });

  let showFullDescription = ref(false);

  const toggleDescription = () => {
    showFullDescription.value = !showFullDescription.value
  }

  const truncatedDescription = computed(() => {
    const description = props.newsItem?.description ?? '';

    if (showFullDescription.value) {
      return description;
    }

    return `${description.substring(0, 90)}...`;
  });
</script>

<template>
    <div class="bg-white rounded-xl shadow-md relative">
            <div class="p-4">
              <div class="mb-6">
                <div class="text-black my-2">{{ newsItem.type }}</div>
                <h3 class="text-xl font-bold text-black">{{ newsItem.title }}</h3>
              </div>

              <div class="mb-5">
                <div class="text-black">
                {{ truncatedDescription }}
                </div>
                <button
                    @click="toggleDescription"
                    class="text-green-500 hover:text-green-600 mb-5"
                >
                    {{ showFullDescription ? 'Less' : 'More' }}
                </button>
              </div>

              <h3 class="text-green-500 mb-2">{{ newsItem.salary }}</h3>

              <div class="border border-gray-100 mb-5"></div>

              <div class="flex flex-col lg:flex-row justify-between mb-4">
                <div class="text-orange-700 mb-3">
                  <i class="pi pi-map-marker text-orange-700 text-lg"></i>
                  {{ newsItem.location }}
                </div>
                <button
                  type="button"
                  @click="showFullDescription = !showFullDescription"
                  class="h-9 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                >
                  {{ showFullDescription ? 'Show less' : 'Learn More' }}
                </button>
              </div>
            </div>
          </div>

</template>
