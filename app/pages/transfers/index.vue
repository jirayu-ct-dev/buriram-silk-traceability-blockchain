<script setup lang="ts">
import { ArrowLeftRight, Plus } from '@lucide/vue'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'การส่งมอบ' })

const toast = useToast()
const { confirm } = useConfirm()

interface TransferItem { id: string, silkItemPublicId: string, silkItemTitle: string, fromOrgName: string, toOrgName: string, status: string, canResolve: boolean, createdAt: string }

const isLoading = ref(true)
const error = ref<string | null>(null)
const items = ref<TransferItem[]>([])
const showCreate = ref(false)
const createForm = ref({ silkItemPublicId: '', toOrgName: '' })

const load = async () => {
  isLoading.value = true
  error.value = null
  try {
    await new Promise(r => setTimeout(r, 400))
    // TODO(api): GET /api/transfers
    items.value = [
      { id: 't-001', silkItemPublicId: 'SI-001', silkItemTitle: 'ผ้าไหมมัดมีกล้วยหอม', fromOrgName: 'สหกรณ์ผ้าไหม', toOrgName: 'ร้านไหมบุรีรัมย์', status: 'PENDING', canResolve: true, createdAt: '2026-08-20T09:00:00Z' },
      { id: 't-002', silkItemPublicId: 'SI-002', silkItemTitle: 'ผ้าไหมโขงสีคราม', fromOrgName: 'สหกรณ์ผ้าไหม', toOrgName: 'ร้านผ้าไหมทอง', status: 'ACCEPTED', canResolve: false, createdAt: '2026-08-18T10:00:00Z' },
    ]
  } catch { error.value = 'โหลดรายการไม่สำเร็จ' } finally { isLoading.value = false }
}
onMounted(load)

const handleCreate = async () => {
  if (!createForm.value.silkItemPublicId.trim() || !createForm.value.toOrgName.trim()) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return }
  const ok = await confirm({ title: 'ยืนยันสร้างการส่งมอบ', message: `ส่ง ${createForm.value.silkItemPublicId} ไปยัง ${createForm.value.toOrgName} ใช่หรือไม่?`, confirmLabel: 'สร้าง' })
  if (!ok) return
  await new Promise(r => setTimeout(r, 500))
  // TODO(api): POST /api/transfers { silkItemPublicId, toOrgName }
  toast.success('สร้างการส่งมอบแล้ว')
  showCreate.value = false
  createForm.value = { silkItemPublicId: '', toOrgName: '' }
  await load()
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden"><ArrowLeftRight class="size-5" aria-hidden="true" /></span>
        <div><h1 class="text-xl font-semibold text-neutral-900">การส่งมอบ</h1><p class="text-sm text-neutral-600">รายการส่งมอบที่เกี่ยวข้องกับคุณ</p></div>
      </div>
      <button type="button" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" @click="showCreate = !showCreate"><Plus class="size-4" aria-hidden="true" />สร้างการส่งมอบ</button>
    </div>

    <div v-if="showCreate" class="mt-6 rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
      <h2 class="text-sm font-semibold text-neutral-900">สร้างการส่งมอบใหม่ (เฉพาะ custodian และ cert ACTIVE)</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div><label for="tf-silk" class="block text-sm font-medium text-neutral-700">รหัสผ้า (มีใบรับรอง ACTIVE)</label><input id="tf-silk" v-model="createForm.silkItemPublicId" type="text" placeholder="เช่น SI-001" class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary" /></div>
        <div><label for="tf-to" class="block text-sm font-medium text-neutral-700">ร้านปลายทาง</label><input id="tf-to" v-model="createForm.toOrgName" type="text" placeholder="ชื่อร้าน" class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary" /></div>
      </div>
      <div class="flex justify-end gap-2"><button type="button" class="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50" @click="showCreate=false">ยกเลิก</button><button type="button" class="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700" @click="handleCreate">ยืนยันสร้าง</button></div>
      <p class="text-xs text-neutral-500">* จะถูกตรวจซ้ำฝั่ง server: ต้องเป็น custodian ปัจจุบัน + ไม่มี pending ซ้อน + cert ACTIVE (§6.3)</p>
    </div>

    <div class="mt-6">
      <div v-if="isLoading"><UiSkeletonList :rows="4" /></div>
      <div v-else-if="error"><UiErrorState :description="error" retry-label="ลองใหม่" @retry="load" /></div>
      <div v-else-if="items.length===0"><UiEmptyState title="ยังไม่มีรายการส่งมอบ" description="เมื่อมีการส่งมอบ รายการจะปรากฏที่นี่" /></div>
      <div v-else class="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table class="w-full text-left text-sm">
          <thead class="bg-neutral-50 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <tr><th class="px-4 py-3">ผ้า</th><th class="px-4 py-3">จาก → ไป</th><th class="px-4 py-3">สถานะ</th><th class="px-4 py-3 text-right">จัดการ</th></tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr v-for="row in items" :key="row.id" class="hover:bg-neutral-50">
              <td class="px-4 py-3"><p class="font-medium text-neutral-900">{{ row.silkItemTitle }}</p><p class="font-mono text-xs text-neutral-500">{{ row.silkItemPublicId }}</p></td>
              <td class="px-4 py-3 text-neutral-700 whitespace-nowrap">{{ row.fromOrgName }} → {{ row.toOrgName }}</td>
              <td class="px-4 py-3"><UiStatusBadge :status="row.status" /></td>
              <td class="px-4 py-3 text-right"><NuxtLink :to="`/transfers/${row.id}`" class="inline-flex rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50">ดู</NuxtLink></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
