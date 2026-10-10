<template>
  <ul class="grid gap-2" aria-busy="true" aria-label="Loading tasks">
    <li
      v-for="n in 3"
      :key="n"
      class="flex animate-pulse items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-4"
    >
      <span class="size-5 rounded-full bg-surface-muted" />
      <div class="grid flex-1 gap-2">
        <span class="h-4 w-2/3 rounded bg-surface-muted" />
        <span class="h-3 w-1/3 rounded bg-surface-muted" />
      </div>
    </li>
  </ul>
</template>
