<script setup lang="ts">
import { X } from '@lucide/vue'
import type { DashboardNavItem } from '~/composables/useDashboardNav'

const props = defineProps<{
  items: DashboardNavItem[]
  open: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const route = useRoute()

const isActive = (to: string) =>
  to === '/' ? route.path === to : route.path === to || route.path.startsWith(`${to}/`)
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-neutral-900 text-neutral-100 transition-transform duration-200 ease-in-out lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
    aria-label="เมนูหลัก"
  >
    <div class="flex h-16 shrink-0 items-center justify-between border-b border-neutral-800 px-4">
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <span class="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-sm font-bold text-amber-400">
          ไหม
        </span>
        <span class="text-sm font-semibold tracking-wide">ผ้าไหมบุรีรัมย์</span>
      </NuxtLink>
      <button
        type="button"
        class="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 lg:hidden"
        aria-label="ปิดเมนู"
        @click="emit('close')"
      >
        <X class="size-5" aria-hidden="true" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto px-2 py-4">
      <ul class="space-y-1">
        <li v-for="item in props.items" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            :class="
              isActive(item.to)
                ? 'bg-amber-500/15 text-amber-300'
                : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
            "
            :aria-current="isActive(item.to) ? 'page' : undefined"
          >
            <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="shrink-0 border-t border-neutral-800 px-4 py-3">
      <p class="text-xs text-neutral-500">
        <span class="mr-1.5 inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Simulation
        </span>
        Local Blockchain
      </p>
    </div>
  </aside>
</template>
