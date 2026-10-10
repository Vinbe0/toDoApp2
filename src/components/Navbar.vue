<script setup>
    import AppLogo from '@/components/ui/AppLogo.vue';
    import { RouterLink } from 'vue-router'
    import { useAuth } from '@/composables/useAuth';

    const { isRegistered } = useAuth();

    const linkClass =
      'text-white font-semibold hover:bg-green-900 text-lg rounded-md px-3 py-2';
    const activeClass = 'bg-green-900';
</script>

<template>
    <nav class="bg-green-700 border-b border-green-500">
      <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div class="flex min-h-20 flex-wrap items-center justify-between gap-2 py-2">
            <RouterLink class="flex flex-shrink-0 items-center mr-4" to="/">
              <AppLogo class="text-white" aria-label="TODOS home" />
            </RouterLink>
            <div class="flex flex-wrap items-center gap-1">
              <RouterLink to="/" :class="linkClass" :exact-active-class="activeClass">Home</RouterLink>
              <RouterLink to="/todo" :class="linkClass" :active-class="activeClass">Manage Tasks</RouterLink>
              <RouterLink to="/privacy" :class="linkClass" :active-class="activeClass">Privacy policy</RouterLink>
              <RouterLink
                v-if="isRegistered"
                :to="{ name: 'account' }"
                :class="linkClass"
                :active-class="activeClass"
                >Account</RouterLink
              >
              <RouterLink v-else to="/login" :class="linkClass" :active-class="activeClass">Log In</RouterLink>
            </div>
        </div>
      </div>
    </nav>
</template>
