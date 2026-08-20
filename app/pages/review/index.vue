<script setup lang="ts">
import { ClipboardList } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'คิวตรวจคำขอ' })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 lg:hidden">
        <ClipboardList class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">คิวตรวจคำขอรับรอง</h1>
        <p class="text-sm text-neutral-600">คำขอที่รอการตรวจสอบจากเจ้าหน้าที่สหกรณ์</p>
      </div>
    </div>

    <!-- TODO(silk-item-workflow): รายการคำขอรอตรวจจะ implement ใน Phase Silk Item Workflow -->
    <div class="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ยังไม่มีคำขอที่รอตรวจ</p>
      <p class="mt-1 text-xs text-neutral-500">
        คิวคำขอรับรองจะเปิดใช้งานใน Phase Silk Item Workflow
      </p>
    </div>
  </div>
</template>
