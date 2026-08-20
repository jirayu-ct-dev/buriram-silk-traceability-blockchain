<script setup lang="ts">
import { Blocks } from '@lucide/vue'

useHead({ title: 'Blockchain Explorer' })
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-16 sm:px-6">
    <div class="text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        <Blocks class="size-6" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">Blockchain Explorer</h1>
      <p class="mt-2 text-sm leading-relaxed text-neutral-600">
        ดูรายการ Block, Validator, Hash และผลตรวจ Chain Integrity ของ Ledger
      </p>
      <p class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800">
        <span class="size-1.5 rounded-full bg-primary-500" aria-hidden="true" />
        ข้อมูลทั้งหมดมาจาก Local Blockchain Simulation
      </p>
    </div>

    <!-- TODO(explorer): รายการ Block จะ implement ใน Phase Blockchain Explorer -->
    <div class="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">Explorer ยังอยู่ระหว่างพัฒนา</p>
      <p class="mt-1 text-xs text-neutral-500">
        รายการ Block และหน้า Block Detail จะเปิดใช้งานหลัง Ledger Simulator พร้อม
      </p>
    </div>
  </div>
</template>
