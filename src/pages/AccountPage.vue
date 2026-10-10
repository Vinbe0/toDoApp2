<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseCard from "@/shared/ui/BaseCard.vue";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { storeToRefs } from "pinia";
import { useTasks } from "@/features/tasks/composables/useTasks";

const router = useRouter();
const auth = useAuthStore();
const { user } = storeToRefs(auth);
const { tasks } = useTasks();

const initials = computed(() => user.value?.email.slice(0, 2).toUpperCase() ?? "?");

const stats = computed(() => {
  const completed = tasks.value.filter((task) => task.completed).length;
  return [
    { label: "Total tasks", value: tasks.value.length },
    { label: "Active", value: tasks.value.length - completed },
    { label: "Completed", value: completed },
  ];
});

const submit = () => {
  auth.logout();
  router.push("/login");
};
</script>

<template>
  <div class="mx-auto grid max-w-3xl gap-6 px-4 py-8 sm:px-6">
    <h1 class="text-3xl font-bold tracking-tight text-fg">Account</h1>

    <BaseCard class="flex flex-wrap items-center gap-4">
      <span
        class="grid size-16 place-items-center rounded-2xl bg-brand-600 text-xl font-bold text-white"
        aria-hidden="true"
      >
        {{ initials }}
      </span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-lg font-semibold text-fg">{{ user?.email }}</p>
        <p class="truncate text-sm text-fg-subtle">User ID: {{ user?.id }}</p>
      </div>
      <BaseButton variant="secondary" @click="submit">
        <i class="pi pi-sign-out" aria-hidden="true" /> Log out
      </BaseButton>
    </BaseCard>

    <div class="grid gap-4 sm:grid-cols-3">
      <BaseCard v-for="stat in stats" :key="stat.label">
        <p class="text-sm text-fg-muted">{{ stat.label }}</p>
        <p class="mt-1 text-3xl font-bold text-fg">{{ stat.value }}</p>
      </BaseCard>
    </div>

    <BaseButton to="/todo" size="lg" class="justify-self-start">
      Go to my tasks <i class="pi pi-arrow-right" aria-hidden="true" />
    </BaseButton>
  </div>
</template>
