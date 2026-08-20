<script setup lang="ts">
import { ArrowLeftRight } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'การส่งมอบ' })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
        <ArrowLeftRight class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">การส่งมอบ</h1>
        <p class="text-sm text-neutral-600">รายการส่งมอบที่เกี่ยวข้องกับคุณ</p>
      </div>
    </div>

    <!-- TODO(custody): รายการ PENDING/ACCEPTED จะ implement ใน Phase Certificate Status & Custody -->
    <div class="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ยังไม่มีรายการส่งมอบ</p>
      <p class="mt-1 text-xs text-neutral-500">
        การส่งมอบจะเปิดใช้งานใน Phase Certificate Status &amp; Custody
      </p>
    </div>
  </div>
</template>
