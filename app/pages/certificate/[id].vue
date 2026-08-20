<script setup lang="ts">
import { ArrowLeft, BadgeCheck } from '@lucide/vue'

useHead({ title: 'รายละเอียดใบรับรอง' })

const route = useRoute()
const certificateCode = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <NuxtLink
      to="/verify"
      class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      ค้นหาใบรับรองอีกครั้ง
    </NuxtLink>

    <div class="mt-6 text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        <BadgeCheck class="size-6" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">รายละเอียดใบรับรอง</h1>
      <p class="mt-2 break-all text-sm text-neutral-600">
        Certificate ID: <span class="font-medium text-neutral-900">{{ certificateCode || '—' }}</span>
      </p>
    </div>

    <!-- TODO(certification): แสดงผล Valid/Inactive/Not Found พร้อมข้อมูลผ้า Issuer Custody Timeline และ Hash Summary จะ implement ใน Phase Certification -->
    <div class="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ยังไม่มีข้อมูลใบรับรองนี้</p>
      <p class="mt-1 text-xs text-neutral-500">
        ผลการตรวจสอบ ข้อมูลผ้าไหม ประวัติการส่งมอบ และ Hash Summary
        จะเปิดใช้งานใน Phase Certification
      </p>
    </div>
  </div>
</template>
