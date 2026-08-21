<script setup lang="ts">
import { Inbox } from '@lucide/vue'
import { markRaw, type Component } from 'vue'

withDefaults(
  defineProps<{
    title: string
    description?: string
    actionLabel?: string
    icon?: Component
  }>(),
  { icon: markRaw(Inbox) },
)

defineEmits<{ action: [] }>()
</script>

<template>
  <div class="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
    <span class="mx-auto flex size-12 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400">
      <component :is="icon" class="size-6" aria-hidden="true" />
    </span>
    <p class="mt-4 text-sm font-medium text-neutral-700">{{ title }}</p>
    <p v-if="description" class="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-neutral-500">
      {{ description }}
    </p>
    <button
      v-if="actionLabel"
      type="button"
      class="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>
