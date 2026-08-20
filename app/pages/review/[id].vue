<script setup lang="ts">
import { ClipboardCheck } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'ตรวจคำขอรับรอง' })

const route = useRoute()
const requestId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
        <ClipboardCheck class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">ตรวจคำขอรับรอง</h1>
        <p class="break-all text-sm text-neutral-600">รหัสคำขอ {{ requestId }}</p>
      </div>
    </div>

    <!-- TODO(silk-item-workflow): การตรวจข้อมูล อนุมัติ และปฏิเสธจะ implement ใน Phase Silk Item Workflow -->
    <div class="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ยังไม่มีข้อมูลคำขอนี้</p>
      <p class="mt-1 text-xs text-neutral-500">
        การตรวจหลักฐาน อนุมัติ และปฏิเสธคำขอจะเปิดใช้งานใน Phase Silk Item Workflow
      </p>
    </div>
  </div>
</template>
