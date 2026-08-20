<script setup lang="ts">
import { QrCode } from '@lucide/vue'

useHead({ title: 'ตรวจสอบใบรับรอง' })
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <div class="text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        <QrCode class="size-6" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">ตรวจสอบใบรับรอง</h1>
      <p class="mt-2 text-sm leading-relaxed text-neutral-600">
        กรอก Certificate ID หรือสแกน QR Code บนผืนผ้า
        เพื่อดูผลการรับรองและประวัติการส่งมอบ
      </p>
    </div>

    <!-- TODO(certification): ฟอร์มค้นหา + กล้องสแกน QR จะ implement ใน Phase Certification -->
    <div class="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ระบบตรวจสอบยังอยู่ระหว่างพัฒนา</p>
      <p class="mt-1 text-xs text-neutral-500">
        ฟอร์มค้นหา Certificate ID และ QR Scanner จะเปิดใช้งานใน Phase Certification
      </p>
    </div>
  </div>
</template>
