<script setup lang="ts">
import { ArrowLeftRight } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'รายละเอียดการส่งมอบ' })

const route = useRoute()
const transferId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
        <ArrowLeftRight class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">รายละเอียดการส่งมอบ</h1>
        <p class="break-all text-sm text-neutral-600">รหัสการส่งมอบ {{ transferId }}</p>
      </div>
    </div>

    <!-- TODO(custody): การยืนยัน ปฏิเสธ และยกเลิกจะ implement ใน Phase Certificate Status & Custody -->
    <div class="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ยังไม่มีข้อมูลการส่งมอบนี้</p>
      <p class="mt-1 text-xs text-neutral-500">
        การยืนยัน ปฏิเสธ และยกเลิกการส่งมอบจะเปิดใช้งานใน Phase Certificate Status &amp; Custody
      </p>
    </div>
  </div>
</template>
