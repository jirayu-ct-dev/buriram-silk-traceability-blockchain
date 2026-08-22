<script setup lang="ts">
import { ArrowLeftRight, Plus, Loader2 } from '@lucide/vue'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import { useAuthSession } from '~/composables/useAuthSession'
import type { CreateTransferInput, OrganizationOption, SilkItemSummary, TransferItem } from '~~/shared/types/api'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'การส่งมอบ' })

const toast = useToast()
const { confirm } = useConfirm()
const { user } = useAuthSession()

const isLoading = ref(true)
const error = ref<string | null>(null)
const items = ref<TransferItem[]>([])

const showCreate = ref(false)
const isCreating = ref(false)
const createForm = ref({ silkItemId: '', toOrgId: '' })

const silkItemOptions = ref<SilkItemSummary[]>([])
const organizationOptions = ref<OrganizationOption[]>([])
const optionsError = ref<string | null>(null)
const isOptionsLoading = ref(false)

const eligibleSilkItems = computed(() =>
  silkItemOptions.value.filter((item) => item.status === 'CERTIFIED' && item.certificateStatus === 'ACTIVE'),
)
const destinationOrganizations = computed(() =>
  organizationOptions.value.filter((org) => org.id !== user.value?.organizationId),
)
const selectedSilkItem = computed(() => eligibleSilkItems.value.find((item) => item.id === createForm.value.silkItemId))
const selectedOrganization = computed(() => destinationOrganizations.value.find((org) => org.id === createForm.value.toOrgId))

const loadTransfers = async () => {
  isLoading.value = true
  error.value = null
  try {
    items.value = await $fetch<TransferItem[]>('/api/transfers')
  } catch {
    error.value = 'โหลดรายการไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    isLoading.value = false
  }
}

const loadOptions = async () => {
  isOptionsLoading.value = true
  optionsError.value = null
  try {
    const [silkItems, organizations] = await Promise.all([
      $fetch<SilkItemSummary[]>('/api/silk-items'),
      $fetch<OrganizationOption[]>('/api/organizations'),
    ])
    silkItemOptions.value = silkItems
    organizationOptions.value = organizations
  } catch {
    optionsError.value = 'โหลดตัวเลือกไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    isOptionsLoading.value = false
  }
}

onMounted(() => {
  loadTransfers()
  loadOptions()
})

const handleCreate = async () => {
  if (!createForm.value.silkItemId || !createForm.value.toOrgId) {
    toast.error('กรุณาเลือกผ้าไหมและองค์กรปลายทาง')
    return
  }

  const ok = await confirm({
    title: 'ยืนยันสร้างการส่งมอบ',
    message: `ส่ง ${selectedSilkItem.value?.publicId ?? ''} ไปยัง ${selectedOrganization.value?.name ?? ''} ใช่หรือไม่?`,
    confirmLabel: 'สร้าง',
  })
  if (!ok) return

  isCreating.value = true
  try {
    const payload: CreateTransferInput = {
      silkItemId: createForm.value.silkItemId,
      toOrgId: createForm.value.toOrgId,
    }
    await $fetch('/api/transfers', { method: 'POST', body: payload })
    toast.success('สร้างการส่งมอบแล้ว')
    showCreate.value = false
    createForm.value = { silkItemId: '', toOrgId: '' }
    await loadTransfers()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'สร้างการส่งมอบไม่สำเร็จ')
  } finally {
    isCreating.value = false
  }
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

      <div v-if="isOptionsLoading" class="flex items-center gap-2 text-sm text-neutral-500">
        <Loader2 class="size-4 animate-spin" aria-hidden="true" />
        กำลังโหลดตัวเลือก...
      </div>
      <div v-else-if="optionsError" class="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-700">
        <p>{{ optionsError }}</p>
        <button type="button" class="mt-3 rounded-lg border border-error-300 bg-white px-3 py-1.5 text-xs font-semibold text-error-700 hover:bg-error-50" @click="loadOptions">ลองใหม่</button>
      </div>
      <div v-else-if="eligibleSilkItems.length === 0" class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        ไม่มีผ้าไหมที่มีใบรับรอง ACTIVE และอยู่ในความดูแลของคุณในขณะนี้
      </div>
      <div v-else-if="destinationOrganizations.length === 0" class="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        ไม่มีองค์กรปลายทางให้เลือก กรุณาติดต่อผู้ดูแลระบบ
      </div>
      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="tf-silk" class="block text-sm font-medium text-neutral-700">ผ้าไหม (มีใบรับรอง ACTIVE)</label>
            <select id="tf-silk" v-model="createForm.silkItemId" class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary">
              <option value="">— เลือกผ้าไหม —</option>
              <option v-for="item in eligibleSilkItems" :key="item.id" :value="item.id">
                {{ item.publicId }} — {{ item.title }}
              </option>
            </select>
          </div>
          <div>
            <label for="tf-to" class="block text-sm font-medium text-neutral-700">องค์กรปลายทาง</label>
            <select id="tf-to" v-model="createForm.toOrgId" class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary">
              <option value="">— เลือกองค์กร —</option>
              <option v-for="org in destinationOrganizations" :key="org.id" :value="org.id">
                {{ org.name }} ({{ org.type === 'STORE' ? 'ร้านค้า' : 'สหกรณ์' }})
              </option>
            </select>
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50" @click="showCreate = false">ยกเลิก</button>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isCreating || !createForm.silkItemId || !createForm.toOrgId"
            @click="handleCreate"
          >
            <Loader2 v-if="isCreating" class="size-4 animate-spin" aria-hidden="true" />
            ยืนยันสร้าง
          </button>
        </div>
        <p class="text-xs text-neutral-500">* จะถูกตรวจซ้ำฝั่ง server: ต้องเป็น custodian ปัจจุบัน + ไม่มี pending ซ้อน + cert ACTIVE (§6.3)</p>
      </template>
    </div>

    <div class="mt-6">
      <div v-if="isLoading"><UiSkeletonList :rows="4" /></div>
      <div v-else-if="error"><UiErrorState :description="error" retry-label="ลองใหม่" @retry="loadTransfers" /></div>
      <div v-else-if="items.length === 0"><UiEmptyState title="ยังไม่มีรายการส่งมอบ" description="เมื่อมีการส่งมอบ รายการจะปรากฏที่นี่" /></div>
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
