<script setup lang="ts">
import { ClipboardCheck, CheckCircle, XCircle, FileText, Loader2 } from '@lucide/vue'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'

definePageMeta({ layout: 'dashboard' })

useHead({ title: 'ตรวจคำขอรับรอง' })

const route = useRoute()
const requestId = computed(() => String(route.params.id ?? ''))
const toast = useToast()
const { confirm } = useConfirm()

const isLoading = ref(true)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const reasonCode = ref('')
const reviewNote = ref('')
const reasonError = ref<string | null>(null)
const noteError = ref<string | null>(null)

interface ReviewDetail {
  requestId: string
  silkItemPublicId: string
  title: string
  pattern?: string
  material?: string
  technique?: string
  widthCm?: number
  lengthCm?: number
  notes?: string
  submittedBy: string
  submittedAt: string
  evidence: { id: string, fileName: string, sha256: string }[]
}

const detail = ref<ReviewDetail | null>(null)

const loadData = async () => {
  isLoading.value = true
  error.value = null
  try {
    await new Promise(r => setTimeout(r, 400))
    // TODO(api): GET /api/silk-items/:id หรือ GET /api/reviews/:id
    detail.value = {
      requestId: requestId.value,
      silkItemPublicId: 'SI-002',
      title: 'ผ้าไหมโขงสีคราม',
      pattern: 'โขง',
      material: 'ไหมผสมฝ้าย',
      technique: 'ทอจักร',
      widthCm: 90,
      lengthCm: 180,
      notes: 'ลวดลายโขงดั้งเดิม สีจากดอกคราม',
      submittedBy: 'แม่บุญมา',
      submittedAt: '2026-08-19T14:20:00Z',
      evidence: [
        { id: 'e1', fileName: 'silk_002_photo.jpg', sha256: 'b2c3d4e5f6a1b2c3...' },
        { id: 'e2', fileName: 'silk_002_detail.pdf', sha256: 'a1b2c3d4e5...' },
      ],
    }
  } catch {
    error.value = 'โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

const validateReject = (): boolean => {
  reasonError.value = null
  noteError.value = null
  let ok = true
  if (!reasonCode.value.trim()) { reasonError.value = 'กรุณาเลือกเหตุผลการปฏิเสธ'; ok = false }
  if (!reviewNote.value.trim()) { noteError.value = 'กรุณากรอกบันทึกการตรวจ'; ok = false }
  return ok
}

const handleApprove = async () => {
  const ok = await confirm({
    title: 'ยืนยันอนุมัติ',
    message: 'คุณต้องการอนุมัติคำขอนี้และออกใบรับรองใช่หรือไม่?',
    confirmLabel: 'อนุมัติ',
  })
  if (!ok) return
  isSubmitting.value = true
  try {
    await new Promise(r => setTimeout(r, 800))
    // TODO(api): POST /api/reviews/:id/approve { idempotencyKey: crypto.randomUUID() }
    toast.success('อนุมัติสำเร็จ — ออกใบรับรองแล้ว')
    await navigateTo('/review')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'อนุมัติไม่สำเร็จ กรุณาลองใหม่')
  } finally { isSubmitting.value = false }
}

const handleReject = async () => {
  if (!validateReject()) return
  const ok = await confirm({
    title: 'ยืนยันปฏิเสธ',
    message: `จะปฏิเสธคำขอนี้ด้วยเหตุผล "${reasonLabelOf(reasonCode.value)}" ใช่หรือไม่?`,
    confirmLabel: 'ปฏิเสธ',
    danger: true,
  })
  if (!ok) return
  isSubmitting.value = true
  try {
    await new Promise(r => setTimeout(r, 800))
    // TODO(api): POST /api/reviews/:id/reject { reasonCode, reviewNote }
    toast.success('ปฏิเสธคำขอแล้ว')
    await navigateTo('/review')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    toast.error(err?.data?.message ?? 'ปฏิเสธไม่สำเร็จ กรุณาลองใหม่')
  } finally { isSubmitting.value = false }
}

const formatDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
const REASON_OPTIONS = [
  { value: 'EVIDENCE_INSUFFICIENT', label: 'หลักฐานไม่ครบถ้วน' },
  { value: 'QUALITY_NOT_MET', label: 'คุณภาพไม่ผ่านเกณฑ์' },
  { value: 'DATA_INCOMPLETE', label: 'ข้อมูลไม่ครบถ้วน' },
  { value: 'OTHER', label: 'อื่น ๆ (ระบุในบันทึก)' },
] as const
const reasonLabelOf = (code: string) => REASON_OPTIONS.find(o => o.value === code)?.label ?? code
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
        <ClipboardCheck class="size-5" aria-hidden="true" />
      </span>
      <div>
        <h1 class="text-xl font-semibold text-neutral-900">ตรวจคำขอรับรอง</h1>
        <p class="break-all text-sm text-neutral-600">รหัสคำขอ {{ requestId }}</p>
      </div>
    </div>

    <div v-if="isLoading" class="mt-6 space-y-3">
      <UiSkeletonList :rows="3" />
      <UiSkeletonList :rows="2" />
    </div>
    <div v-else-if="error" class="mt-6">
      <UiErrorState :description="error" retry-label="ลองใหม่" @retry="loadData" />
    </div>
    <div v-else-if="detail" class="mt-6 space-y-6">
      <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
          <h2 class="text-sm font-semibold text-neutral-900">ข้อมูลผ้าไหม</h2>
        </div>
        <div class="p-6 grid gap-4 sm:grid-cols-2 text-sm">
          <div class="sm:col-span-2"><span class="text-neutral-500">ชื่อผืน</span><p class="font-medium text-neutral-900">{{ detail.title }}</p></div>
          <div><span class="text-neutral-500">รหัสผ้า</span><p class="font-mono text-neutral-900">{{ detail.silkItemPublicId }}</p></div>
          <div><span class="text-neutral-500">ผู้ส่ง</span><p class="text-neutral-900">{{ detail.submittedBy }} · {{ formatDate(detail.submittedAt) }}</p></div>
          <div><span class="text-neutral-500">ลวดลาย</span><p class="text-neutral-900">{{ detail.pattern ?? '—' }}</p></div>
          <div><span class="text-neutral-500">วัสดุ</span><p class="text-neutral-900">{{ detail.material ?? '—' }}</p></div>
          <div><span class="text-neutral-500">เทคนิค</span><p class="text-neutral-900">{{ detail.technique ?? '—' }}</p></div>
          <div><span class="text-neutral-500">ขนาด</span><p class="text-neutral-900">{{ detail.widthCm ?? '—' }} × {{ detail.lengthCm ?? '—' }} ซม.</p></div>
          <div class="sm:col-span-2"><span class="text-neutral-500">หมายเหตุ</span><p class="text-neutral-900 whitespace-pre-wrap">{{ detail.notes ?? '—' }}</p></div>
        </div>
      </div>

      <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
          <h2 class="text-sm font-semibold text-neutral-900">หลักฐาน ({{ detail.evidence.length }})</h2>
        </div>
        <ul class="divide-y divide-neutral-200 p-2">
          <li v-for="f in detail.evidence" :key="f.id" class="flex items-center gap-3 px-4 py-3">
            <FileText class="size-4 text-neutral-400 shrink-0" aria-hidden="true" />
            <span class="flex-1 truncate text-sm text-neutral-900">{{ f.fileName }}</span>
            <span class="font-mono text-xs text-neutral-500 truncate max-w-[140px]">{{ f.sha256 }}</span>
          </li>
        </ul>
      </div>

      <div class="rounded-xl border border-neutral-200 bg-white p-6 space-y-4">
        <h2 class="text-sm font-semibold text-neutral-900">ตัดสินผลตรวจ</h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="reasonCode" class="block text-sm font-medium text-neutral-700">เหตุผลการปฏิเสธ <span class="text-neutral-400">(จำเป็นเมื่อกดปฏิเสธ)</span></label>
            <select id="reasonCode" v-model="reasonCode" class="mt-1.5 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary" :class="reasonError ? 'border-error-500' : ''">
              <option value="">— เลือกเหตุผล —</option>
              <option v-for="o in REASON_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <p v-if="reasonError" class="mt-1 text-xs text-error-700" role="alert">{{ reasonError }}</p>
          </div>
          <div class="sm:col-span-2">
            <label for="reviewNote" class="block text-sm font-medium text-neutral-700">บันทึกการตรวจ <span class="text-error-600">*</span></label>
            <textarea id="reviewNote" v-model="reviewNote" rows="3" placeholder="ระบุเหตุผล/ข้อเสนอแนะให้ช่างทอ" class="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary" :class="noteError ? 'border-error-500' : ''" />
            <p v-if="noteError" class="mt-1 text-xs text-error-700" role="alert">{{ noteError }}</p>
          </div>
        </div>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" :disabled="isSubmitting" class="inline-flex items-center justify-center gap-2 rounded-lg border border-error-300 bg-white px-4 py-2.5 text-sm font-semibold text-error-700 hover:bg-error-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-600" @click="handleReject">
            <XCircle class="size-4" aria-hidden="true" />
            ปฏิเสธ
          </button>
          <button type="button" :disabled="isSubmitting" class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" @click="handleApprove">
            <Loader2 v-if="isSubmitting" class="size-4 animate-spin" aria-hidden="true" />
            <CheckCircle v-else class="size-4" aria-hidden="true" />
            อนุมัติ
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
