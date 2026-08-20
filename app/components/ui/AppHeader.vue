<script setup lang="ts">
import { Menu, PanelLeftClose, PanelLeftOpen } from '@lucide/vue'

defineEmits<{ openDrawer: [] }>()

const collapsed = useSidebarCollapsed()
const role = useDemoRole()
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8"
  >
    <button
      type="button"
      class="hidden rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:inline-flex"
      :aria-label="collapsed ? 'ขยายเมนูด้านข้าง' : 'ยุบเมนูด้านข้าง'"
      @click="collapsed = !collapsed"
    >
      <PanelLeftOpen v-if="collapsed" class="size-5" aria-hidden="true" />
      <PanelLeftClose v-else class="size-5" aria-hidden="true" />
    </button>

    <button
      type="button"
      class="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
      aria-label="เปิดเมนู"
      @click="$emit('openDrawer')"
    >
      <Menu class="size-5" aria-hidden="true" />
    </button>

    <span class="truncate text-sm font-semibold text-neutral-900 lg:hidden">
      ผ้าไหมบุรีรัมย์
    </span>

    <slot />

    <div class="ml-auto flex shrink-0 items-center gap-2">
      <UiAppUserMenu v-if="role" />
    </div>
  </header>
</template>
