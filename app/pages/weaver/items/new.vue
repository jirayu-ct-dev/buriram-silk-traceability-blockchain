<script setup lang="ts">
import { FilePlus2 } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'ลงทะเบียนผ้าไหม' })
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
        <FilePlus2 class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">ลงทะเบียนผ้าไหม</h1>
        <p class="text-sm text-neutral-600">กรอกข้อมูลและแนบหลักฐานเพื่อส่งขอรับรอง</p>
      </div>
    </div>

    <!-- TODO(silk-item-workflow): ฟอร์มลงทะเบียนจะ implement ใน Phase Silk Item Workflow -->
    <div class="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ฟอร์มลงทะเบียนผ้าไหมยังไม่เปิดใช้งาน</p>
      <p class="mt-1 text-xs text-neutral-500">
        ฟอร์มลงทะเบียนและการแนบหลักฐานจะเปิดใช้งานใน Phase Silk Item Workflow
      </p>
    </div>
  </div>
</template>
