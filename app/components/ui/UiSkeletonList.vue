<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 })
</script>

<template>
  <div class="flex flex-col gap-3" aria-hidden="true">
    <div
      v-for="row in rows"
      :key="row"
      class="rounded-xl border border-neutral-200 bg-white p-4"
    >
      <div class="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
      <div class="mt-3 h-3 w-1/2 animate-pulse rounded bg-neutral-100" />
    </div>
  </div>
</template>
