<script setup lang="ts">
import { Blocks, Copy, Check } from '@lucide/vue'
import { useToast } from '~/composables/useToast'

useHead({ title: 'Blockchain Explorer' })
const toast = useToast()

interface BlockSummary { index: number, timestamp: string, hash: string, previousHash: string, validatorName: string, eventCount: number }

const isLoading = ref(true)
const error = ref<string | null>(null)
const blocks = ref<BlockSummary[]>([])
const verifyResult = ref<{ valid: boolean, checkedBlocks: number } | null>(null)
const copied = ref<string | null>(null)

const truncate = (h: string) => h.length > 16 ? `${h.slice(0, 8)}...${h.slice(-6)}` : h
const copy = async (v: string, k: string) => { await navigator.clipboard.writeText(v); copied.value = k; toast.success('คัดลอก hash แล้ว'); setTimeout(() => copied.value = null, 2000) }

const load = async () => {
  isLoading.value = true; error.value = null
  try {
    const [blocksData, verifyData] = await Promise.all([
      $fetch<BlockSummary[]>('/api/ledger/blocks'),
      $fetch<{ valid: boolean, checkedBlocks: number }>('/api/ledger/verify'),
    ])
    blocks.value = blocksData
    verifyResult.value = verifyData
  } catch { error.value = 'โหลด ledger ไม่สำเร็จ' } finally { isLoading.value = false }
}
onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <div class="text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><Blocks class="size-6" aria-hidden="true" /></span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">Blockchain Explorer</h1>
      <p class="mt-2 text-sm leading-relaxed text-neutral-600">ดูรายการ Block, Validator, Hash และผลตรวจ Chain Integrity</p>
      <p class="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800"><span class="size-1.5 rounded-full bg-primary-500" aria-hidden="true" />ข้อมูลทั้งหมดมาจาก Local Blockchain Simulation</p>
      <div v-if="verifyResult" class="mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium" :class="verifyResult.valid ? 'border-success-200 bg-success-50 text-success-700' : 'border-error-200 bg-error-50 text-error-700'">
        {{ verifyResult.valid ? `Chain Integrity: ผ่าน (${verifyResult.checkedBlocks} blocks)` : 'Chain Invalid — ห้ามทำ mutation เพิ่ม' }}
      </div>
    </div>

    <div class="mt-8">
      <div v-if="isLoading" class="space-y-3"><UiSkeletonList :rows="4" /></div>
      <div v-else-if="error" class="text-center"><UiErrorState :description="error" retry-label="ลองใหม่" @retry="load" /></div>
      <div v-else-if="blocks.length===0"><UiEmptyState title="ยังไม่มี block" description="เมื่อมีการออกใบรับรองหรือส่งมอบ block จะปรากฏที่นี่" /></div>
      <div v-else class="space-y-3">
        <NuxtLink v-for="b in blocks" :key="b.index" :to="`/ledger/${b.index}`" class="block rounded-xl border border-neutral-200 bg-white p-4 hover:border-primary-300 hover:bg-primary-50/40 transition-colors">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-neutral-900">#{{ b.index }} <span class="font-normal text-neutral-500">· {{ new Date(b.timestamp).toLocaleDateString('th-TH') }}</span></p>
              <p class="mt-1 flex items-center gap-1 font-mono text-xs text-neutral-600"><span :title="b.hash">{{ truncate(b.hash) }}</span>
                <button type="button" class="rounded p-0.5 hover:bg-neutral-100" aria-label="คัดลอก hash" @click.prevent="copy(b.hash, String(b.index))"><Check v-if="copied===String(b.index)" class="size-3.5 text-success-600" /><Copy v-else class="size-3.5" /></button>
                <span class="text-neutral-400">· {{ b.validatorName }} · {{ b.eventCount }} event</span>
              </p>
            </div>
            <span class="shrink-0 text-xs text-primary-600">ดู →</span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
