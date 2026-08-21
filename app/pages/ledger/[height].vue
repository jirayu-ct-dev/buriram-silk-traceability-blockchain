<script setup lang="ts">
import { ArrowLeft, Hash, Copy, Check } from '@lucide/vue'
import { useToast } from '~/composables/useToast'

useHead({ title: 'รายละเอียด Block' })
const route = useRoute()
const blockHeight = computed(() => String(route.params.height ?? ''))
const toast = useToast()

const isLoading = ref(true)
const error = ref<string | null>(null)
const copied = ref<string | null>(null)
const block = ref<{ index: number, timestamp: string, hash: string, previousHash: string, validatorName: string, signatureValid: boolean, events: { eventType: string, aggregateId?: string, payload: Record<string, unknown> }[] } | null>(null)

const truncate = (h: string) => h.length > 16 ? `${h.slice(0, 8)}...${h.slice(-6)}` : h
const copy = async (v: string, k: string) => { await navigator.clipboard.writeText(v); copied.value = k; toast.success('คัดลอกแล้ว'); setTimeout(() => copied.value = null, 2000) }

const load = async () => {
  isLoading.value = true; error.value = null
  try {
    await new Promise(r => setTimeout(r, 400))
    // TODO(api): GET /api/ledger/blocks/:index
    const idx = Number(blockHeight.value)
    if (Number.isNaN(idx)) throw new Error('invalid')
    block.value = {
      index: idx, timestamp: '2026-08-15T08:00:00Z', hash: 'a1b2c3d4e5f67890abcdef1234567890abcdef12', previousHash: '0000genesisabcd1234567890',
      validatorName: ['COOPERATIVE_AUTHORITY','LOCAL_CERTIFIER_AUTHORITY','RETAIL_NETWORK_AUTHORITY'][idx % 3] ?? 'COOPERATIVE_AUTHORITY',
      signatureValid: true,
      events: idx === 0 ? [{ eventType: 'GENESIS', payload: { networkId: 'buriram-silk' } }] : [{ eventType: 'ISSUE_CERTIFICATE', aggregateId: 'SI-001', payload: { certificateCode: 'BR-SILK-001' } }],
    }
  } catch { error.value = 'ไม่พบ block นี้'; block.value = null } finally { isLoading.value = false }
}
onMounted(load)
watch(blockHeight, load)
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <NuxtLink to="/ledger" class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><ArrowLeft class="size-4" aria-hidden="true" />กลับไป Blockchain Explorer</NuxtLink>
    <div class="mt-6 text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><Hash class="size-6" aria-hidden="true" /></span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">Block <span v-if="blockHeight!==''">#{{ blockHeight }}</span></h1>
      <p class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800"><span class="size-1.5 rounded-full bg-primary-500" aria-hidden="true" />Local Blockchain Simulation</p>
    </div>

    <div v-if="isLoading" class="mt-8"><UiSkeletonList :rows="4" /></div>
    <div v-else-if="error" class="mt-8"><UiErrorState :description="error" retry-label="ลองใหม่" @retry="load" /></div>
    <div v-else-if="block" class="mt-8 space-y-6">
      <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-neutral-900">Block Header</h2>
          <UiStatusBadge :status="block.signatureValid ? 'VALID' : 'CHAIN_INVALID'" />
        </div>
        <div class="p-6 space-y-3 text-sm">
          <div class="flex justify-between gap-3"><span class="text-neutral-500">Index</span><span class="font-mono text-neutral-900">#{{ block.index }}</span></div>
          <div class="flex justify-between gap-3"><span class="text-neutral-500">Timestamp</span><span class="text-neutral-900">{{ new Date(block.timestamp).toLocaleString('th-TH') }}</span></div>
          <div class="flex justify-between gap-3 items-center"><span class="text-neutral-500">Hash</span><span class="flex items-center gap-1 font-mono text-xs text-neutral-900"><span :title="block.hash">{{ truncate(block.hash) }}</span><button type="button" class="rounded p-1 hover:bg-neutral-100" aria-label="คัดลอก hash" @click="copy(block.hash,'h')"><Check v-if="copied==='h'" class="size-3.5 text-success-600" /><Copy v-else class="size-3.5" /></button></span></div>
          <div class="flex justify-between gap-3 items-center"><span class="text-neutral-500">Previous Hash</span><span class="flex items-center gap-1 font-mono text-xs text-neutral-900"><span :title="block.previousHash">{{ truncate(block.previousHash) }}</span><button type="button" class="rounded p-1 hover:bg-neutral-100" aria-label="คัดลอก previous hash" @click="copy(block.previousHash,'ph')"><Check v-if="copied==='ph'" class="size-3.5 text-success-600" /><Copy v-else class="size-3.5" /></button></span></div>
          <div class="flex justify-between gap-3"><span class="text-neutral-500">Validator</span><span class="text-neutral-900">{{ block.validatorName }}</span></div>
          <div class="flex justify-between gap-3"><span class="text-neutral-500">Signature</span><span :class="block.signatureValid ? 'text-success-700' : 'text-error-700'">{{ block.signatureValid ? 'Valid' : 'Invalid' }}</span></div>
        </div>
      </div>
      <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200"><h2 class="text-sm font-semibold text-neutral-900">Events ({{ block.events.length }})</h2></div>
        <ul class="divide-y divide-neutral-200">
          <li v-for="(e,i) in block.events" :key="i" class="px-6 py-4">
            <p class="text-sm font-medium text-neutral-900">{{ e.eventType }} <span v-if="e.aggregateId" class="font-mono text-xs text-neutral-500">({{ e.aggregateId }})</span></p>
            <pre class="mt-2 overflow-x-auto rounded bg-neutral-50 p-3 text-xs text-neutral-700">{{ JSON.stringify(e.payload, null, 2) }}</pre>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
