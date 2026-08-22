<script setup lang="ts">
import { ArrowLeftRight, CheckCircle, XCircle } from '@lucide/vue'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import type { TransferItem } from '~~/shared/types/api'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'รายละเอียดการส่งมอบ' })

const route = useRoute()
const transferId = computed(() => String(route.params.id ?? ''))
const toast = useToast()
const { confirm } = useConfirm()

const isLoading = ref(true)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const detail = ref<TransferItem | null>(null)

const load = async () => {
  isLoading.value = true; error.value = null
  try {
    const detailUrl = String(`/api/transfers/${transferId.value}`)
    detail.value = await $fetch<TransferItem>(detailUrl)
  } catch { error.value = 'โหลดไม่สำเร็จ' } finally { isLoading.value = false }
}
onMounted(load)

const handleAccept = async () => {
  const ok = await confirm({ title: 'ยืนยัันรบัการส่งมอบ', message: 'คณตองการยืนยัันรบัผ้าไหมรายการนนี้ใชหรอไม?', confirmLabel: 'ยืนยัันรบั' })
  if (!ok) return
  isSubmitting.value = true
  try {
    await $fetch(String(`/api/transfers/${transferId.value}/accept`), { method: 'POST' })
    toast.success('ยืนยัันรบัแลว')
    await navigateTo('/transfers')
  } catch { toast.error('ยืนยัันไม่สำเร็จ') } finally { isSubmitting.value = false }
}
const handleReject = async () => {
  const ok = await confirm({ title: 'ยืนยัันปฏิเสธ', message: 'คณตองการปฏิเสธการส่งมอบนนี้ใชหรอไม?', confirmLabel: 'ปฏิเสธ', danger: true })
  if (!ok) return
  isSubmitting.value = true
  try {
    await $fetch(String(`/api/transfers/${transferId.value}/reject`), { method: 'POST' })
    toast.success('ปฏิเสธแลว')
    await navigateTo('/transfers')
  } catch { toast.error('ปฏิเสธไม่สำเร็จ') } finally { isSubmitting.value = false }
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden"><ArrowLeftRight class="size-5" aria-hidden="true" /></span>
      <div><h1 class="text-xl font-semibold text-neutral-900">รายละเอียดการส่งมอบ</h1><p class="break-all text-sm text-neutral-600">รหัส {{ transferId }}</p></div>
    </div>

    <div v-if="isLoading" class="mt-6"><UiSkeletonList :rows="3" /></div>
    <div v-else-if="error" class="mt-6"><UiErrorState :description="error" retry-label="ลองใหม่" @retry="load" /></div>
    <div v-else-if="detail" class="mt-6 space-y-6">
      <div class="rounded-xl border border-neutral-200 bg-white p-6 grid gap-4 sm:grid-cols-2 text-sm">
        <div><span class="text-neutral-500">ผ้า</span><p class="font-medium text-neutral-900">{{ detail.silkItemTitle }} <span class="font-mono text-xs text-neutral-500">({{ detail.silkItemPublicId }})</span></p></div>
        <div><span class="text-neutral-500">สถานะ</span><p class="mt-1"><UiStatusBadge :status="detail.status" /></p></div>
        <div><span class="text-neutral-500">จาก</span><p class="text-neutral-900">{{ detail.fromOrgName }}</p></div>
        <div><span class="text-neutral-500">ไป</span><p class="text-neutral-900">{{ detail.toOrgName }}</p></div>
        <div><span class="text-neutral-500">วันที่สร้าง</span><p class="text-neutral-900">{{ new Date(detail.createdAt).toLocaleDateString('th-TH') }}</p></div>
      </div>
      <div v-if="detail.canResolve && detail.status==='PENDING'" class="flex gap-3 justify-end">
        <button type="button" :disabled="isSubmitting" class="inline-flex items-center gap-2 rounded-lg border border-error-300 bg-white px-4 py-2.5 text-sm font-semibold text-error-700 hover:bg-error-50 disabled:opacity-50" @click="handleReject"><XCircle class="size-4" aria-hidden="true" />ปฏิเสธ</button>
        <button type="button" :disabled="isSubmitting" class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50" @click="handleAccept"><CheckCircle class="size-4" aria-hidden="true" />ยืนยันรับ</button>
      </div>
      <p v-else class="text-sm text-neutral-500 text-center">รายการนี้ไม่อยู่ในสถานะที่ยืนยัน/ปฏิเสธได้</p>
    </div>
  </div>
</template>
