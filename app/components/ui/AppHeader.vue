<script setup lang="ts">
import { Menu, User } from '@lucide/vue'
import type { DashboardRole } from '~/composables/useDashboardNav'

defineProps<{
  role: DashboardRole
}>()

defineEmits<{ openDrawer: [] }>()

const ROLE_LABELS: Record<DashboardRole, string> = {
  WEAVER: 'ช่างทอ',
  COOPERATIVE_OFFICER: 'เจ้าหน้าที่สหกรณ์',
  STORE_USER: 'ร้านค้า',
}
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8"
  >
    <button
      type="button"
      class="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 lg:hidden"
      aria-label="เปิดเมนู"
      @click="$emit('openDrawer')"
    >
      <Menu class="size-5" aria-hidden="true" />
    </button>

    <span class="truncate text-sm font-semibold text-neutral-900 lg:hidden">
      ผ้าไหมบุรีรัมย์
    </span>

    <slot />

    <!-- TODO(auth): เปลี่ยนเป็นข้อมูลจาก session และเพิ่มปุ่มออกจากระบบหลัง implement Phase Auth/RBAC -->
    <div class="ml-auto flex items-center gap-2.5 rounded-full border border-neutral-200 bg-neutral-50 py-1 pl-1 pr-3.5">
      <span class="flex size-7 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        <User class="size-4" aria-hidden="true" />
      </span>
      <span class="text-xs leading-tight">
        <span class="block font-medium text-neutral-900">ผู้ใช้ตัวอย่าง</span>
        <span class="block text-neutral-500">{{ ROLE_LABELS[role] }}</span>
      </span>
    </div>
  </header>
</template>
