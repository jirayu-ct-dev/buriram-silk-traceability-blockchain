<script setup lang="ts">
import { ArrowLeft, BadgeCheck, Copy, Check, ShieldAlert, ShieldCheck, ShieldX } from '@lucide/vue'
import { getStatusMeta } from '~/composables/useStatusMeta'
import { useToast } from '~/composables/useToast'

useHead({ title: 'รายละเอียดใบรับรอง' })

const route = useRoute()
const certificateCode = computed(() => String(route.params.id ?? ''))
const toast = useToast()

type PublicResult = 'VALID' | 'SUSPENDED' | 'REVOKED' | 'NOT_FOUND' | 'CHAIN_INVALID'
interface PublicCertificate {
  result: PublicResult
  certificateCode: string
  issuedAt?: string
  silkItem: { publicId: string, title: string, pattern?: string, technique?: string }
  weaverDisplayName: string
  issuerOrgName: string
  custodyTimeline: { event: string, orgName: string, at: string }[]
  hashSummary: { blockIndex: number, blockHash: string, previousHash: string, validatorName: string, signatureValid: boolean }
}

const isLoading = ref(true)
const error = ref<string | null>(null)
const data = ref<PublicCertificate | null>(null)
const copied = ref<string | null>(null)

const truncate = (h: string) => h.length > 16 ? `${h.slice(0, 8)}...${h.slice(-6)}` : h
const copy = async (v: string, key: string) => {
  await navigator.clipboard.writeText(v)
  copied.value = key
  toast.success('คัดลอกแล้ว')
  setTimeout(() => copied.value = null, 2000)
}

const load = async () => {
  isLoading.value = true
  error.value = null
  data.value = null
  const code = certificateCode.value.trim()
  if (!code) { error.value = 'ไม่พบ Certificate ID'; isLoading.value = false; return }
  try {
    data.value = await $fetch<PublicCertificate>(String(`/api/public/certificates/${encodeURIComponent(code)}`))
  } catch {
    error.value = 'โหลดข้้อมูลไม่สำเร็จ กรุณาลองใหม่'
  } finally { isLoading.value = false }
}

onMounted(load)
watch(certificateCode, load)

const meta = computed(() => data.value ? getStatusMeta(data.value.result) : null)
const heroTone: Record<string, string> = {
  VALID: 'bg-success-50 border-success-200 text-success-700',
  SUSPENDED: 'bg-warning-50 border-warning-200 text-warning-800',
  REVOKED: 'bg-error-50 border-error-200 text-error-700',
  NOT_FOUND: 'bg-neutral-100 border-neutral-200 text-neutral-600',
  CHAIN_INVALID: 'bg-error-50 border-error-200 text-error-700',
}
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <NuxtLink to="/verify" class="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <ArrowLeft class="size-4" aria-hidden="true" />
      ค้นหาใบรับรองอีกครั้ง
    </NuxtLink>

    <div class="mt-6 text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        <BadgeCheck class="size-6" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">รายละเอียดใบรับรอง</h1>
      <p class="mt-2 break-all text-sm text-neutral-600">Certificate ID: <span class="font-medium text-neutral-900">{{ certificateCode || '—' }}</span></p>
    </div>

    <div v-if="isLoading" class="mt-8 space-y-3">
      <UiSkeletonList :rows="3" />
    </div>
    <div v-else-if="error" class="mt-8">
      <UiErrorState :description="error" retry-label="ลองใหม่" @retry="load" />
    </div>
    <div v-else-if="data" class="mt-8 space-y-6">
      <div class="rounded-xl border p-6 text-center" :class="heroTone[data.result] ?? 'bg-white border-neutral-200'">
        <div class="flex justify-center">
          <ShieldCheck v-if="data.result==='VALID'" class="size-8" aria-hidden="true" />
          <ShieldAlert v-else-if="data.result==='SUSPENDED'" class="size-8" aria-hidden="true" />
          <ShieldX v-else class="size-8" aria-hidden="true" />
        </div>
        <p class="mt-2 text-lg font-bold">{{ meta?.label ?? data.result }}</p>
        <p v-if="data.result==='VALID'" class="mt-1 text-xs">ใบรับรองนี้ใช้งานได้ — ตรวจสอบประวัติและ hash ด้านล่าง</p>
        <p v-else-if="data.result==='SUSPENDED'" class="mt-1 text-xs">ใบรับรองถูกระงับชั่วคราว — ไม่ควรใช้ยืนยันสินค้า</p>
        <p v-else-if="data.result==='REVOKED'" class="mt-1 text-xs">ใบรับรองถูกเพิกถอน — ไม่ควรใช้ยืนยันสินค้า</p>
        <p v-else-if="data.result==='NOT_FOUND'" class="mt-1 text-xs">ไม่พบใบรับรองนี้ — QR/รหัสอาจไม่ถูกต้องหรือปลอม</p>
        <p v-else class="mt-1 text-xs">ตรวจความสมบูรณ์ของ chain ไม่ผ่าน — ห้ามแสดง Valid</p>
        <p class="mt-3 text-xs opacity-70">Valid ยืนยันเฉพาะ Digital Record/กระบวนการรับรองที่บันทึกไว้ ไม่ใช่การตรวจคุณภาพกายภาพแบบ real-time (§12)</p>
      </div>

      <template v-if="data.result !== 'NOT_FOUND'">
        <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200"><h2 class="text-sm font-semibold text-neutral-900">ข้อมูลผ้าไหม</h2></div>
          <div class="p-6 grid gap-4 sm:grid-cols-2 text-sm">
            <div><span class="text-neutral-500">ชื่อผืน</span><p class="font-medium text-neutral-900">{{ data.silkItem.title }}</p></div>
            <div><span class="text-neutral-500">รหัสผ้า</span><p class="font-mono text-neutral-900">{{ data.silkItem.publicId }}</p></div>
            <div><span class="text-neutral-500">ช่างทอ</span><p class="text-neutral-900">{{ data.weaverDisplayName }}</p></div>
            <div><span class="text-neutral-500">ผู้ออกใบรับรอง</span><p class="text-neutral-900">{{ data.issuerOrgName }}</p></div>
            <div><span class="text-neutral-500">ลวดลาย</span><p class="text-neutral-900">{{ data.silkItem.pattern ?? '—' }}</p></div>
            <div><span class="text-neutral-500">เทคนิค</span><p class="text-neutral-900">{{ data.silkItem.technique ?? '—' }}</p></div>
          </div>
        </div>

        <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200"><h2 class="text-sm font-semibold text-neutral-900">ประวัติการครอบครอง (Custody Timeline)</h2></div>
          <ol class="p-6 space-y-4">
            <li v-for="(e,i) in data.custodyTimeline" :key="i" class="flex gap-4">
              <span class="mt-1 size-2.5 shrink-0 rounded-full bg-primary-600" aria-hidden="true" />
              <div>
                <p class="text-sm font-medium text-neutral-900">{{ e.event }} — {{ e.orgName }}</p>
                <p class="text-xs text-neutral-500">{{ new Date(e.at).toLocaleDateString('th-TH',{year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) }}</p>
              </div>
            </li>
            <li v-if="data.custodyTimeline.length===0" class="text-sm text-neutral-500">ยังไม่มีประวัติการส่งมอบ</li>
          </ol>
        </div>

        <div class="rounded-xl border border-neutral-200 bg-white overflow-hidden">
          <div class="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-neutral-900">Hash Summary</h2>
            <UiStatusBadge :status="data.hashSummary.signatureValid ? 'VALID' : 'CHAIN_INVALID'" />
          </div>
          <div class="p-6 space-y-3 text-sm">
            <div class="flex items-center justify-between gap-3"><span class="text-neutral-500">Block Index</span><span class="font-mono text-neutral-900">#{{ data.hashSummary.blockIndex }}</span></div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-neutral-500">Block Hash</span>
              <span class="flex items-center gap-1 font-mono text-xs text-neutral-900"><span :title="data.hashSummary.blockHash">{{ truncate(data.hashSummary.blockHash) }}</span>
                <button type="button" class="rounded p-1 hover:bg-neutral-100" aria-label="คัดลอก hash" @click="copy(data.hashSummary.blockHash,'bh')"><Check v-if="copied==='bh'" class="size-3.5 text-success-600" /><Copy v-else class="size-3.5" /></button>
              </span>
            </div>
            <div class="flex items-center justify-between gap-3">
              <span class="text-neutral-500">Previous Hash</span>
              <span class="flex items-center gap-1 font-mono text-xs text-neutral-900"><span :title="data.hashSummary.previousHash">{{ truncate(data.hashSummary.previousHash) }}</span>
                <button type="button" class="rounded p-1 hover:bg-neutral-100" aria-label="คัดลอก previous hash" @click="copy(data.hashSummary.previousHash,'ph')"><Check v-if="copied==='ph'" class="size-3.5 text-success-600" /><Copy v-else class="size-3.5" /></button>
              </span>
            </div>
            <div class="flex items-center justify-between gap-3"><span class="text-neutral-500">Validator</span><span class="text-neutral-900">{{ data.hashSummary.validatorName }}</span></div>
          </div>
        </div>
      </template>
      <div v-else class="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <p class="text-sm font-medium text-neutral-700">ไม่พบใบรับรองนี้</p>
        <p class="mt-1 text-xs text-neutral-500">ตรวจสอบว่าใส่ Certificate ID ถูกต้อง หรือสแกน QR อีกครั้ง</p>
        <NuxtLink to="/verify" class="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">กลับไปค้นหา</NuxtLink>
      </div>
    </div>
  </div>
</template>
