<script setup lang="ts">
import { X } from '@lucide/vue'
import type { DashboardNavItem } from '~/composables/useDashboardNav'

const props = defineProps<{
  items: DashboardNavItem[]
  open: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const collapsed = useSidebarCollapsed()

// เลือก item ที่เป็น prefix ยาวที่สุดของ path
// เช่น /weaver/items/new ต้อง active "ลงทะเบียนผ้าไหม" ไม่ใช่ "ภาพรวม" ด้วย
const activeTo = computed(() => {
  const matches = props.items
    .filter(item =>
      item.to === '/' ? route.path === '/' : route.path === item.to || route.path.startsWith(`${item.to}/`),
    )
    .sort((a, b) => b.to.length - a.to.length)
  return matches[0]?.to ?? null
})

const isActive = (to: string) => activeTo.value === to
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-neutral-900 text-neutral-100 transition-all duration-200 ease-in-out lg:translate-x-0"
    :class="[
      collapsed ? 'lg:w-20' : 'lg:w-64',
      open ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="เมนูหลัก"
  >
    <div
      class="flex h-16 shrink-0 items-center border-b border-neutral-800 px-4"
      :class="collapsed ? 'lg:justify-center lg:px-2' : 'justify-between'"
    >
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 rounded-md py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
      >
        <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-sm font-bold text-primary-400">
          ไหม
        </span>
        <span class="text-sm font-semibold tracking-wide" :class="collapsed ? 'lg:sr-only' : ''">ผ้าไหมบุรีรัมย์</span>
      </NuxtLink>
      <button
        type="button"
        class="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400 lg:hidden"
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
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400"
            :class="[
              isActive(item.to)
                ? 'bg-primary-500/15 text-primary-300'
                : 'text-neutral-300 hover:bg-neutral-800 hover:text-white',
              collapsed ? 'lg:justify-center' : '',
            ]"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            :title="collapsed ? item.label : undefined"
          >
            <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
            <span :class="collapsed ? 'lg:sr-only' : ''">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <div class="shrink-0 border-t border-neutral-800 px-4 py-3">
      <p class="text-xs text-neutral-500" :class="collapsed ? 'lg:hidden' : ''">
        <span class="mr-1.5 inline-block rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
          Simulation
        </span>
        Local Blockchain
      </p>
    </div>
  </aside>
</template>
