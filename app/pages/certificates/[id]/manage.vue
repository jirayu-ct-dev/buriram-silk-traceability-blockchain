<script setup lang="ts">
import { ShieldCheck, Pause, Play, Ban } from '@lucide/vue'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'จัดการใบรับรอง' })

const route = useRoute()
const certificateId = computed(() => String(route.params.id ?? ''))
const toast = useToast()
const { confirmWithReason } = useConfirm()

const isLoading = ref(true)
const error = ref<string | null>(null)
const status = ref<'ACTIVE' | 'SUSPENDED' | 'REVOKED'>('ACTIVE')
const isSubmitting = ref(false)

const load = async () => {
  isLoading.value = true; error.value = null
  try {
    const cert = await $fetch<{ status: 'ACTIVE' | 'SUSPENDED' | 'REVOKED' }>(String(`/api/certificates/${certificateId.value}`))
    status.value = cert.status
  } catch { error.value = 'โหลดไม่สำเร็จ' } finally { isLoading.value = false }
}
onMounted(load)

const doAction = async (action: 'SUSPEND' | 'REACTIVATE' | 'REVOKE') => {
  const label = action === 'SUSPEND' ? 'ระงับ' : action === 'REACTIVATE' ? 'คืนสถานะ' : 'เพิกถอน'
  const danger = action === 'REVOKE'
  const reason = await confirmWithReason({
    title: `ยืนยัน${label}ใบรับรอง`,
    message: action === 'REVOKE' ? 'การเพิกถอนย้อนกลับไม่ได้ ใบรับรองจะใช้งานไม่ได้ถาวร' : `คุณต้องการ${label}ใบรับรองนี้ใช่หรือไม่?`,
    confirmLabel: label,
    cancelLabel: 'ยกเลิก',
    danger,
    reasonLabel: 'เหตุผล',
    reasonPlaceholder: 'ระบุเหตุผลเพื่อบันทึกลงประวัติ',
  })
  if (reason === null) return
  isSubmitting.value = true
  try {
    await $fetch(String(`/api/certificates/${certificateId.value}/status`), {
      method: 'POST',
      body: { action, reason },
    })
    if (action === 'SUSPEND') status.value = 'SUSPENDED'
    else if (action === 'REACTIVATE') status.value = 'ACTIVE'
    else status.value = 'REVOKED'
    toast.success(`${label}สำเร็จ`)
  } catch (e: unknown) { const err = e as { data?: { message?: string } }; toast.error(err?.data?.message ?? `${label}ไม่สำเร็จ`) } finally { isSubmitting.value = false }
}
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden"><ShieldCheck class="size-5" aria-hidden="true" /></span>
      <div><h1 class="text-xl font-semibold text-neutral-900">จัดการใบรับรอง</h1><p class="break-all text-sm text-neutral-600">รหัสใบรับรอง {{ certificateId }}</p></div>
    </div>

    <div v-if="isLoading" class="mt-6"><UiSkeletonList :rows="2" /></div>
    <div v-else-if="error" class="mt-6"><UiErrorState :description="error" retry-label="ลองใหม่" @retry="load" /></div>
    <div v-else class="mt-6 space-y-6">
      <div class="rounded-xl border border-neutral-200 bg-white p-6 flex items-center justify-between">
        <div><p class="text-sm text-neutral-500">สถานะปัจจุบัน</p><p class="mt-1"><UiStatusBadge :status="status" /></p></div>
        <span class="text-xs text-neutral-500">REVOKED ย้อนกลับไม่ได้ (§7.2)</span>
      </div>
      <div class="rounded-xl border border-neutral-200 bg-white p-6 space-y-3">
        <h2 class="text-sm font-semibold text-neutral-900">การจัดการ (ต้องระบุเหตุผลทุกครั้ง)</h2>
        <div class="flex flex-col sm:flex-row gap-3">
          <button type="button" :disabled="isSubmitting || status!=='ACTIVE'" class="inline-flex items-center justify-center gap-2 rounded-lg bg-warning-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-warning-700 disabled:opacity-40 disabled:cursor-not-allowed" @click="doAction('SUSPEND')"><Pause class="size-4" aria-hidden="true" />ระงับ</button>
          <button type="button" :disabled="isSubmitting || status!=='SUSPENDED'" class="inline-flex items-center justify-center gap-2 rounded-lg bg-success-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-success-700 disabled:opacity-40 disabled:cursor-not-allowed" @click="doAction('REACTIVATE')"><Play class="size-4" aria-hidden="true" />คืนสถานะ</button>
          <button type="button" :disabled="isSubmitting || status==='REVOKED'" class="inline-flex items-center justify-center gap-2 rounded-lg bg-error-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-error-700 disabled:opacity-40 disabled:cursor-not-allowed" @click="doAction('REVOKE')"><Ban class="size-4" aria-hidden="true" />เพิกถอน (ถาวร)</button>
        </div>
        <p class="text-xs text-neutral-500">ทุก action สร้าง ledger event แบบ atomic (CERTIFICATE_SUSPENDED/REACTIVATED/REVOKED) — ทุกปุ่มผ่าน useConfirm + ช่องเหตุผล required</p>
      </div>
    </div>
  </div>
</template>
