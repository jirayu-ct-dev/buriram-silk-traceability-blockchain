<script setup lang="ts">
import { History } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'Audit Trail' })

const route = useRoute()
const silkItemId = computed(() => String(route.params.id ?? ''))
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
        <History class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">Audit Trail</h1>
        <p class="break-all text-sm text-neutral-600">รหัสผ้าไหม {{ silkItemId }}</p>
      </div>
    </div>

    <!-- TODO(ledger-simulator): ประวัติการเปลี่ยนแปลงจะ implement หลัง Phase Ledger Simulator -->
    <div class="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
      <p class="text-sm font-medium text-neutral-700">ยังไม่มีประวัติการเปลี่ยนแปลง</p>
      <p class="mt-1 text-xs text-neutral-500">
        Audit Trail ฉบับภายในจะเปิดใช้งานหลัง Phase Ledger Simulator
      </p>
    </div>
  </div>
</template>
