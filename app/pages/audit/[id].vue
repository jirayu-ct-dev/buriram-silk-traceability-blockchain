<script setup lang="ts">
import { History } from '@lucide/vue'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'Audit Trail' })

const route = useRoute()
const silkItemId = computed(() => String(route.params.id ?? ''))

const isLoading = ref(true)
const error = ref<string | null>(null)
interface AuditEntry { at: string, actor: string, action: string, detail: string }
const entries = ref<AuditEntry[]>([])

const load = async () => {
  isLoading.value = true; error.value = null
  try {
    await new Promise(r => setTimeout(r, 400))
    // TODO(api): GET /api/audit/:silkItemId — mock ก่อน
    entries.value = [
      { at: '2026-08-10T09:00:00Z', actor: 'แม่สมใจ (WEAVER)', action: 'CREATE_DRAFT', detail: 'สร้างฉบับร่าง #1' },
      { at: '2026-08-18T09:30:00Z', actor: 'แม่สมใจ (WEAVER)', action: 'SUBMIT', detail: 'ส่งขอรับรอง' },
      { at: '2026-08-19T14:20:00Z', actor: 'เจ้าหน้าที่สหกรณ์', action: 'APPROVE', detail: 'อนุมัติ — ออกใบรับรอง BR-SILK-001' },
      { at: '2026-08-20T10:00:00Z', actor: 'สหกรณ์ผ้าไหม', action: 'TRANSFER_INITIATED', detail: 'เริ่มส่งมอบไป ร้านไหมบุรีรัมย์' },
    ]
  } catch { error.value = 'โหลดไม่สำเร็จ' } finally { isLoading.value = false }
}
onMounted(load)
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden"><History class="size-5" aria-hidden="true" /></span>
      <div><h1 class="text-xl font-semibold text-neutral-900">Audit Trail</h1><p class="break-all text-sm text-neutral-600">รหัสผ้าไหม {{ silkItemId }}</p></div>
    </div>

    <div class="mt-6">
      <div v-if="isLoading"><UiSkeletonList :rows="4" /></div>
      <div v-else-if="error"><UiErrorState :description="error" retry-label="ลองใหม่" @retry="load" /></div>
      <div v-else-if="entries.length===0"><UiEmptyState title="ยังไม่มีประวัติ" description="เมื่อมีการเปลี่ยนแปลง ประวัติจะปรากฏที่นี่" /></div>
      <div v-else class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="bg-neutral-50 px-6 py-3 border-b border-neutral-200"><p class="text-xs font-medium text-neutral-500">เรียงตามเวลา — ล่าสุดอยู่ล่าง</p></div>
        <ol class="divide-y divide-neutral-200">
          <li v-for="(e,i) in entries" :key="i" class="px-6 py-4 flex gap-4">
            <span class="mt-1.5 size-2 shrink-0 rounded-full bg-primary-500" aria-hidden="true" />
            <div class="min-w-0">
              <p class="text-sm font-medium text-neutral-900">{{ e.action }} <span class="font-normal text-neutral-500">— {{ e.actor }}</span></p>
              <p class="text-xs text-neutral-600">{{ e.detail }}</p>
              <p class="text-xs text-neutral-500">{{ new Date(e.at).toLocaleString('th-TH') }}</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>
