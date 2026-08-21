<script setup lang="ts">
import { ServerCrash } from '@lucide/vue'

withDefaults(
  defineProps<{
    title?: string
    description?: string
    retryLabel?: string
  }>(),
  {
    title: 'เกิดข้อผิดพลาด',
    // ไม่เปิดเผยรายละเอียดระบบ — บอกวิธีแก้ที่ผู้ใช้ทำได้เอง
    description: 'ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง',
    retryLabel: 'ลองใหม่',
  },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="rounded-xl border border-error-200 bg-error-50 px-6 py-12 text-center">
    <span class="mx-auto flex size-12 items-center justify-center rounded-xl bg-error-100 text-error-600">
      <ServerCrash class="size-6" aria-hidden="true" />
    </span>
    <p class="mt-4 text-sm font-semibold text-neutral-900">{{ title }}</p>
    <p class="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-neutral-600">
      {{ description }}
    </p>
    <button
      type="button"
      class="mt-5 inline-flex items-center justify-center rounded-lg border border-error-300 bg-white px-4 py-2.5 text-sm font-semibold text-error-700 transition-colors hover:bg-error-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600"
      @click="$emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
