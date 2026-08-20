<script setup lang="ts">
import { ArrowLeft, Hash } from '@lucide/vue'

useHead({ title: 'รายละเอียด Block' })

const route = useRoute()
const blockHeight = computed(() => String(route.params.height ?? ''))
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <NuxtLink
      to="/ledger"
      class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
    >
      <ArrowLeft class="size-4" aria-hidden="true" />
      กลับไป Blockchain Explorer
    </NuxtLink>

    <div class="mt-6 text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        <Hash class="size-6" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">
        Block <span v-if="blockHeight !== ''">#{{ blockHeight }}</span>
      </h1>
      <p class="mt-2 text-sm text-neutral-600">
        Block Header, Event, Previous Hash และผลตรวจลายเซ็น Validator
      </p>
      <p class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800">
        <span class="size-1.5 rounded-full bg-primary-500" aria-hidden="true" />
        ข้อมูลทั้งหมดมาจาก Local Blockchain Simulation
      </p>
    </div>

    <!-- TODO(explorer): Block Header, Event, Previous Hash และ Signature Verification จะ implement หลัง Ledger Simulator พร้อม -->
    <div class="mt-10 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ยังไม่มีข้อมูล Block นี้</p>
      <p class="mt-1 text-xs text-neutral-500">
        รายละเอียด Block จะเปิดใช้งานหลัง Ledger Simulator พร้อม
      </p>
    </div>
  </div>
</template>
