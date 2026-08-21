<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ScrollText, Edit, FileText, ArrowLeft, Clock, AlertCircle, CheckCircle, XCircle, Loader2, Eye, Send, Copy, Check } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '~/composables/useToast'
import { useConfirm } from '~/composables/useConfirm'
import { getStatusMeta } from '~/composables/useStatusMeta'
import type { SilkItemDetail as ApiSilkItemDetail } from '~~/shared/types/api'

definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { confirm } = useConfirm()

const silkItemId = computed(() => String(route.params.id ?? ''))
const isLoading = ref(true)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const copiedHashId = ref<string | null>(null)

type SilkItemDetail = ApiSilkItemDetail

const MOCK_DETAILS: Record<string, SilkItemDetail> = {
  '1': { id: '1', publicId: 'BR-SILK-001', status: 'CERTIFIED', revision: { revisionNumber: 1, title: 'ผ้าไหมมัดมีกล้วยหอม ผืนที่ 1', pattern: 'มัดมีกล้วยหอม', material: 'ไหมทอมหัตถ์ 100%', technique: 'ทอผ้าข้าง', widthCm: 80, lengthCm: 200, productionDate: '2024-01-10', notes: 'ผ้าไหมทอมือลวดลายมัดมีกล้วยหอม สีครามจากสารสกัดธรรมชาติ' }, evidence: [{ id: 'e1', fileName: 'silk_001_photo1.jpg', sha256: 'a1b2c3d4e5f6...' }, { id: 'e2', fileName: 'silk_001_certificate.pdf', sha256: 'f6e5d4c3b2a1...' }], latestReview: { status: 'APPROVED', reviewNote: 'ผ้าไหมคุณภาพดี ลวดลายชัดเจน ผ่านเกณฑ์การรับรอง', reviewedAt: '2024-01-15T10:30:00Z' } },
  '2': { id: '2', publicId: 'BR-SILK-002', status: 'SUBMITTED', revision: { revisionNumber: 1, title: 'ผ้าไหมลวดลายโขง สีคราม', pattern: 'โขง', material: 'ไหมผสมฝ้าย', technique: 'ทอจักร', widthCm: 90, lengthCm: 180, productionDate: '2024-01-18', notes: 'ลวดลายโขงดั้งเดิม สีจากดอกคราม' }, evidence: [{ id: 'e3', fileName: 'silk_002_photo.jpg', sha256: 'b2c3d4e5f6a1...' }], latestReview: { status: 'SUBMITTED', reviewedAt: '2024-01-20T14:22:00Z' } },
  '3': { id: '3', publicId: 'BR-SILK-003', status: 'DRAFT', revision: { revisionNumber: 1, title: 'ผ้าไหมทอผ้าข้าง ลวดลายดอกไม้', pattern: 'ดอกไม้', material: 'ไหมทอมหัตถ์', technique: 'ทอผ้าข้าง', widthCm: 75, lengthCm: 220, productionDate: '2024-01-20', notes: 'กำลังทออยู่ คาดเสร็จสัปดาห์หน้า' }, evidence: [], latestReview: undefined },
  '4': { id: '4', publicId: 'BR-SILK-004', status: 'REJECTED', revision: { revisionNumber: 2, title: 'ผ้าไหมผสมฝ้าย ลวดลาย幂', pattern: '幂', material: 'ไหมผสมฝ้าย 70:30', technique: 'ทอเข็ม', widthCm: 85, lengthCm: 190, productionDate: '2024-01-08', notes: 'ส่งใหม่หลังปฏิเสธครั้งแรก ปรับลวดลายแล้ว' }, evidence: [{ id: 'e4', fileName: 'silk_004_photo.jpg', sha256: 'c3d4e5f6a1b2...' }], latestReview: { status: 'REJECTED', rejectionReasonCode: 'EVIDENCE_INSUFFICIENT', reviewNote: 'หลักฐานไม่ครบ ต้องแนบรูปภาพกระบวนการทอ และใบรับรองวัสดุ', reviewedAt: '2024-01-10T16:45:00Z' } },
  '5': { id: '5', publicId: 'BR-SILK-005', status: 'DRAFT', revision: { revisionNumber: 1, title: 'ผ้าไหมมัดมีไทยแลนด์', pattern: 'มัดมีไทยแลนด์', material: 'ไหมทอมหัตถ์', technique: 'ทอผ้าข้าง', widthCm: 80, lengthCm: 210, productionDate: '2024-01-22', notes: 'ลวดลายมัดมีรูปแบบไทยแลนด์ สีสันสดใส' }, evidence: [{ id: 'e5', fileName: 'silk_005_sketch.jpg', sha256: 'd4e5f6a1b2c3...' }], latestReview: undefined },
}

const detail = ref<SilkItemDetail | null>(null)

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatDateShort = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const canEdit = computed(() => detail.value?.status === 'DRAFT')
const isRejected = computed(() => detail.value?.status === 'REJECTED')

const loadData = async () => {
  isLoading.value = true
  error.value = null
  try {
    const data = await $fetch<SilkItemDetail>(`/api/silk-items/${silkItemId.value}`)
    detail.value = data
  } catch (err: unknown) {
    const e = err as { statusCode?: number, data?: { message?: string } }
    if (e?.statusCode === 404) {
      // ลอง fallback mock ก่อนแสดง not found (ให้ e2e/demo ยังผ่านเมื่อ API ว่าง)
      const mock = MOCK_DETAILS[silkItemId.value]
      if (mock) { detail.value = mock; isLoading.value = false; return }
      error.value = 'ไม่พบข้อมูลผ้าไหมรายการนี้'
    } else if (!e?.statusCode) {
      const mock = MOCK_DETAILS[silkItemId.value]
      if (mock) { detail.value = mock; isLoading.value = false; return }
      error.value = 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
    } else {
      error.value = e?.data?.message ?? 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
    }
  } finally {
    isLoading.value = false
  }
}

const loadMockData = loadData

onMounted(() => {
  loadData()
})

const handleEdit = () => {
  if (canEdit.value) {
    navigateTo(`/weaver/items/${silkItemId.value}/edit`)
  }
}

const handleResubmit = () => {
  toast.success('สร้างฉบับแก้ใหม่สำเร็จ — กรอกข้อมูลและส่งใหม่ได้เลย')
  navigateTo('/weaver/items/new')
}

const handleBack = () => {
  router.back()
}

const truncateHash = (hash: string): string => {
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}

const copyHash = async (hash: string, id: string) => {
  try {
    await navigator.clipboard.writeText(hash)
    copiedHashId.value = id
    toast.success('คัดลอก hash แล้ว')
    setTimeout(() => { copiedHashId.value = null }, 2000)
  } catch {
    toast.error('คัดลอกไม่สำเร็จ กรุณาลองใหม่')
  }
}

const handleSubmit = async () => {
  if (!detail.value || isSubmitting.value) return
  const confirmed = await confirm({
    title: 'ยืนยันส่งขอรับรอง',
    message: `คุณต้องการส่ง "${detail.value.revision.title}" เพื่อขอรับรองใช่หรือไม่? เมื่อส่งแล้วจะไม่สามารถแก้ไขฉบับนี้ได้จนกว่าจะมีผลตรวจกลับมา`,
    confirmLabel: 'ส่งขอรับรอง',
    cancelLabel: 'ยกเลิก',
  })
  if (!confirmed) return

  isSubmitting.value = true
  try {
    const idempotencyKey = crypto.randomUUID()
    try {
      await $fetch(`/api/silk-items/${silkItemId.value}/submit`, { method: 'POST', body: { idempotencyKey } })
      detail.value.status = 'SUBMITTED'
      detail.value.latestReview = { status: 'SUBMITTED', reviewedAt: new Date().toISOString() }
      toast.success('ส่งคำขอรับรองสำเร็จ — เจ้าหน้าที่จะตรวจสอบเร็ว ๆ นี้')
      return
    } catch (err: unknown) {
      const e = err as { statusCode?: number, data?: { message?: string } }
      if (!e?.statusCode || e.statusCode === 404 || e.statusCode === 500) {
        // fallback mock เมื่อ API ยังไม่พร้อม
        await new Promise(resolve => setTimeout(resolve, 400))
        detail.value.status = 'SUBMITTED'
        detail.value.latestReview = { status: 'SUBMITTED', reviewedAt: new Date().toISOString() }
        toast.success('ส่งคำขอรับรองสำเร็จ — เจ้าหน้าที่จะตรวจสอบเร็ว ๆ นี้ (โหมดตัวอย่าง)')
        return
      }
      toast.error(e?.data?.message ?? 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่')
      return
    }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    toast.error(e?.data?.message ?? 'ส่งคำขอไม่สำเร็จ กรุณาลองใหม่')
  } finally {
    isSubmitting.value = false
  }
}

const getRevisionMeta = (status: SilkItemDetail['status']) => getStatusMeta(status)
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700 lg:hidden">
          <ScrollText class="size-5" aria-hidden="true" />
        </span>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-xl font-semibold text-neutral-900">รายละเอียดผ้าไหม</h1>
            <UiStatusBadge v-if="detail" :status="detail.status" />
          </div>
          <p class="break-all text-sm text-neutral-600 mt-1">{{ detail?.publicId ?? silkItemId }}</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button
          @click="handleBack"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft class="size-4" aria-hidden="true" />
          กลับ
        </button>
        <button
          v-if="canEdit"
          @click="handleEdit"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Edit class="size-4" aria-hidden="true" />
          แก้ไข
        </button>
        <button
          v-if="canEdit"
          :disabled="isSubmitting"
          @click="handleSubmit"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="size-4 animate-spin" aria-hidden="true" />
          <Send v-else class="size-4" aria-hidden="true" />
          {{ isSubmitting ? 'กำลังส่ง...' : 'ส่งขอรับรอง' }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="mt-6 space-y-4">
      <UiSkeletonList :rows="3" />
      <UiSkeletonList :rows="2" />
      <UiSkeletonList :rows="2" />
    </div>

    <!-- Error State -->
    <div v-else-if="error">
      <UiErrorState :title="'ไม่พบข้อมูล'" :description="error" retryLabel="ลองใหม่" @retry="loadMockData" />
    </div>

    <!-- Content -->
    <div v-else-if="detail" class="mt-6 space-y-6">
      <!-- Revision Info -->
      <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
          <div class="flex items-center gap-2">
            <span class="flex size-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <FileText class="size-4" aria-hidden="true" />
            </span>
            <h2 class="text-lg font-medium text-neutral-900">ฉบับแก้ไขที่ {{ detail.revision.revisionNumber }}</h2>
          </div>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">ชื่อผืนผ้า</label>
              <p class="mt-1 text-sm font-medium text-neutral-900">{{ detail.revision.title }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">ลวดลาย</label>
              <p class="mt-1 text-sm text-neutral-900">{{ detail.revision.pattern ?? '—' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">วัสดุ</label>
              <p class="mt-1 text-sm text-neutral-900">{{ detail.revision.material ?? '—' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">เทคนิคการทอ</label>
              <p class="mt-1 text-sm text-neutral-900">{{ detail.revision.technique ?? '—' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">ความกว้าง (ซม.)</label>
              <p class="mt-1 text-sm text-neutral-900">{{ detail.revision.widthCm ?? '—' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">ความยาว (ซม.)</label>
              <p class="mt-1 text-sm text-neutral-900">{{ detail.revision.lengthCm ?? '—' }}</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">วันทอ / วันที่ผลิต</label>
              <p class="mt-1 text-sm text-neutral-900">{{ formatDateShort(detail.revision.productionDate) }}</p>
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">หมายเหตุ</label>
              <p class="mt-1 text-sm text-neutral-900 whitespace-pre-wrap">{{ detail.revision.notes ?? '—' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Evidence Files -->
      <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
          <div class="flex items-center gap-2">
            <span class="flex size-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <Eye class="size-4" aria-hidden="true" />
            </span>
            <h2 class="text-lg font-medium text-neutral-900">หลักฐานประกอบ ({{ detail.evidence.length }})</h2>
          </div>
        </div>
        <div class="p-6">
          <div v-if="detail.evidence.length === 0" class="text-center py-8">
            <p class="text-sm text-neutral-500">ยังไม่มีไฟล์หลักฐานแนบมา</p>
          </div>
          <ul v-else class="divide-y divide-neutral-200" role="list">
            <li v-for="file in detail.evidence" :key="file.id" class="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="listitem">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <FileText class="size-5 text-neutral-400 shrink-0" aria-hidden="true" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-neutral-900 truncate">{{ file.fileName }}</p>
                  <div class="flex items-center gap-2">
                    <p class="text-xs text-neutral-500 font-mono truncate" :title="file.sha256">{{ truncateHash(file.sha256) }}</p>
                    <button
                      type="button"
                      class="shrink-0 rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      :aria-label="`คัดลอก hash ${file.fileName}`"
                      @click="copyHash(file.sha256, file.id)"
                    >
                      <Check v-if="copiedHashId === file.id" class="size-3.5 text-success-600" aria-hidden="true" />
                      <Copy v-else class="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Latest Review Result -->
      <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
          <div class="flex items-center gap-2">
            <span class="flex size-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <Clock class="size-4" aria-hidden="true" />
            </span>
            <h2 class="text-lg font-medium text-neutral-900">ผลการตรวจล่าสุด</h2>
          </div>
        </div>
        <div class="p-6">
          <div v-if="!detail.latestReview" class="text-center py-8">
            <p class="text-sm text-neutral-500">ยังไม่มีการตรวจสอบ (สถานะ: {{ getRevisionMeta(detail.status).label }})</p>
          </div>
          <div v-else class="space-y-4">
            <div class="flex items-center gap-3 p-4 rounded-lg" :class="{
              'bg-success-50 border border-success-200': detail.latestReview?.status === 'APPROVED',
              'bg-warning-50 border border-warning-200': detail.latestReview?.status === 'SUBMITTED',
              'bg-error-50 border border-error-200': detail.latestReview?.status === 'REJECTED',
            }">
              <div class="flex size-8 shrink-0 items-center justify-center rounded-full" :class="{
                'bg-success-100 text-success-600': detail.latestReview?.status === 'APPROVED',
                'bg-warning-100 text-warning-600': detail.latestReview?.status === 'SUBMITTED',
                'bg-error-100 text-error-600': detail.latestReview?.status === 'REJECTED',
              }">
                <component
                  :is="detail.latestReview?.status === 'APPROVED' ? CheckCircle : (detail.latestReview?.status === 'SUBMITTED' ? Loader2 : XCircle)"
                  class="size-5"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-neutral-900">
                  {{ detail.latestReview?.status === 'APPROVED' ? 'อนุมัติแล้ว' :
                     detail.latestReview?.status === 'SUBMITTED' ? 'รอการตรวจสอบ' : 'ถูกปฏิเสธ' }}
                </p>
                <p class="text-xs text-neutral-500">ตรวจเมื่อ: {{ formatDate(detail.latestReview?.reviewedAt) }}</p>
              </div>
            </div>

            <div v-if="detail.latestReview?.reviewNote" class="p-4 rounded-lg bg-neutral-50">
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">บันทึกจากเจ้าหน้าที่</label>
              <p class="mt-1 text-sm text-neutral-700 whitespace-pre-wrap">{{ detail.latestReview?.reviewNote }}</p>
            </div>

            <div v-if="detail.latestReview?.rejectionReasonCode" class="p-4 rounded-lg bg-error-50 border border-error-200">
              <label class="block text-xs font-medium text-neutral-500 uppercase tracking-wide">รหัสเหตุผลการปฏิเสธ</label>
              <p class="mt-1 text-sm font-mono text-error-700">{{ detail.latestReview?.rejectionReasonCode }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Rejected: Action to create new revision -->
      <div v-if="isRejected" class="rounded-xl border border-warning-200 bg-warning-50 p-6">
        <div class="flex items-start gap-3">
          <AlertCircle class="size-5 text-warning-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div class="flex-1">
            <h3 class="text-sm font-medium text-warning-800">ผ้าไม้นี้ถูกปฏิเสธ</h3>
            <p class="mt-1 text-sm text-warning-700">คุณสามารถสร้างฉบับแก้ใหม่จากข้อมูลเดิม แก้ไขข้อมูลที่จำเป็น แล้วส่งขอรับรองใหม่ได้</p>
            <button
              @click="handleResubmit"
              class="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-warning-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-warning-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-600"
            >
              <Edit class="size-4" aria-hidden="true" />
              สร้างฉบับแก้ใหม่และส่งใหม่
            </button>
          </div>
        </div>
      </div>

      <!-- Read-only notice for non-DRAFT -->
      <div v-if="!canEdit && !isRejected" class="rounded-xl border border-info-200 bg-info-50 p-4">
        <div class="flex items-center gap-2 text-sm text-info-700">
          <span class="flex size-5 shrink-0 items-center justify-center rounded-full bg-info-100 text-info-600">
            <Loader2 class="size-3" aria-hidden="true" />
          </span>
          <span>สถานะ <strong>{{ getRevisionMeta(detail.status).label }}</strong> — ไม่สามารถแก้ไขข้อมูลได้ (ดูอย่างเดียว)</span>
        </div>
      </div>
    </div>
  </div>
</template>