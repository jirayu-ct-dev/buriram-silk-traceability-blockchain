<script setup lang="ts">
import { QrCode, Search } from '@lucide/vue'

useHead({ title: 'ตรวจสอบใบรับรอง' })

const route = useRoute()
const code = ref(String(route.query.code ?? ''))
const error = ref<string | null>(null)

onMounted(() => {
  const q = String(route.query.code ?? '').trim()
  if (q) code.value = q
})

const handleVerify = () => {
  error.value = null
  const trimmed = code.value.trim()
  if (!trimmed) { error.value = 'กรุณากรอก Certificate ID'; return }
  navigateTo(`/certificate/${encodeURIComponent(trimmed)}`)
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
    <div class="text-center">
      <span class="inline-flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
        <QrCode class="size-6" aria-hidden="true" />
      </span>
      <h1 class="mt-4 text-2xl font-bold text-neutral-900">ตรวจสอบใบรับรอง</h1>
      <p class="mt-2 text-sm leading-relaxed text-neutral-600">
        กรอก Certificate ID หรือสแกน QR Code บนผืนผ้า เพื่อดูผลการรับรองและประวัติการส่งมอบ
      </p>
    </div>

    <form class="mt-10 rounded-xl border border-neutral-200 bg-white p-6 space-y-4" novalidate @submit.prevent="handleVerify">
      <div>
        <label for="cert-code" class="block text-sm font-medium text-neutral-700">Certificate ID <span class="text-error-600">*</span></label>
        <div class="mt-1.5 flex gap-2">
          <input
            id="cert-code"
            v-model="code"
            type="text"
            placeholder="เช่น BR-SILK-XXXXXX"
            autocomplete="off"
            class="flex-1 rounded-lg border px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
            :class="error ? 'border-error-500' : 'border-neutral-300'"
            :aria-invalid="error ? 'true' : 'false'"
            :aria-describedby="error ? 'cert-code-error' : undefined"
          />
          <button type="submit" class="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <Search class="size-4" aria-hidden="true" />
            ตรวจสอบ
          </button>
        </div>
        <p v-if="error" id="cert-code-error" class="mt-1.5 text-xs text-error-700" role="alert">{{ error }}</p>
        <p class="mt-2 text-xs text-neutral-500">รองรับการเปิดจาก QR: <span class="font-mono">/verify?code=BR-SILK-XXXXXX</span> จะเติมอัตโนมัติ</p>
      </div>
      <div class="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center">
        <p class="text-xs font-medium text-neutral-700">สแกน QR ด้วยกล้อง</p>
        <p class="mt-1 text-xs text-neutral-500">เปิดกล้องต้องเรียกหลัง mounted เท่านั้น — ตอนนี้ให้กรอก code ด้านบนเป็น fallback (ตาม §14.4)</p>
      </div>
    </form>
  </div>
</template>
