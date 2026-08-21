<script setup lang="ts">
import { X } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useConfirmDialogState, type ConfirmReasonOptions } from '~/composables/useConfirm'

const pending = useConfirmDialogState()

const isOpen = computed(() => pending.value !== null)
const options = computed(() => pending.value?.options ?? null)
const isDanger = computed(() => options.value?.danger === true)
const needsReason = computed(() => pending.value?.kind === 'reason')

const titleId = 'app-confirm-title'
const descriptionId = 'app-confirm-description'

const reason = ref('')
const reasonError = ref<string | null>(null)
const cardRef = useTemplateRef<HTMLElement>('cardRef')
const cancelRef = useTemplateRef<HTMLButtonElement>('cancelRef')

let previouslyFocused: HTMLElement | null = null

const settle = (result: boolean | string | null) => {
  const request = pending.value
  if (!request) return
  pending.value = null
  if (request.kind === 'confirm') request.resolve(Boolean(result))
  else request.resolve(typeof result === 'string' ? result : null)
}

const cancel = () => settle(false)

const submit = () => {
  if (needsReason.value) {
    const trimmed = reason.value.trim()
    if (trimmed === '') {
      reasonError.value = 'กรุณาระบุเหตุผล เพื่อบันทึกลงประวัติการตรวจสอบ'
      return
    }
    settle(trimmed)
    return
  }
  settle(true)
}

// เปิด dialog: ล้างค่าเดิม, ล็อก scroll, เก็บ focus เดิมแล้วย้ายเข้า dialog (ที่ปุ่มยกเลิก — action ปลอดภัยกว่า)
watch(isOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    reason.value = ''
    reasonError.value = null
    previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.documentElement.style.overflow = 'hidden'
    nextTick(() => cancelRef.value?.focus())
    return
  }
  document.documentElement.style.overflow = ''
  nextTick(() => {
    previouslyFocused?.focus()
    previouslyFocused = null
  })
})

onBeforeUnmount(() => {
  if (import.meta.client) document.documentElement.style.overflow = ''
})

const FOCUSABLE_SELECTOR
  = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

// Focus trap: Tab/Shift+Tab วนอยู่ใน dialog เท่านั้น; Enter ยืนยัน; Escape ยกเลิก (ข้อบังคับ brief 1.2)
const onKeydown = (event: KeyboardEvent) => {
  if (!isOpen.value || !cardRef.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    cancel()
    return
  }
  if (event.key === 'Enter' && (event.target as HTMLElement)?.tagName !== 'BUTTON') {
    event.preventDefault()
    submit()
    return
  }
  if (event.key !== 'Tab') return

  const focusables = Array.from(cardRef.value.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  if (focusables.length === 0) return
  const first = focusables[0]!
  const last = focusables[focusables.length - 1]!
  const active = document.activeElement

  if (event.shiftKey && (active === first || !cardRef.value.contains(active))) {
    event.preventDefault()
    last.focus()
  }
  else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="pending && options" class="fixed inset-0 z-[80]" @keydown="onKeydown">
      <!-- overlay กันคลิกทะลุ แต่ไม่ปิดอัตโนมัติ — action กลุ่มนี้ต้องเลือกชัดเจน -->
      <div class="absolute inset-0 bg-black/50" aria-hidden="true" />

      <div
        ref="cardRef"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        :aria-describedby="descriptionId"
        class="absolute top-1/2 left-1/2 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 :id="titleId" class="text-base font-semibold text-neutral-900">
          {{ options.title }}
        </h2>
        <p :id="descriptionId" class="mt-2 text-sm leading-relaxed text-neutral-600">
          {{ options.message }}
        </p>

        <div v-if="needsReason" class="mt-4">
          <label for="app-confirm-reason" class="block text-sm font-medium text-neutral-900">
            {{ (options as ConfirmReasonOptions).reasonLabel }} <span class="text-error-600">*</span>
          </label>
          <input
            id="app-confirm-reason"
            v-model="reason"
            type="text"
            :placeholder="(options as ConfirmReasonOptions).reasonPlaceholder"
            class="mt-1.5 w-full rounded-lg border px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-neutral-100"
            :class="reasonError ? 'border-error-500' : 'border-neutral-300'"
            :aria-invalid="reasonError ? true : undefined"
            aria-describedby="app-confirm-reason-error"
            @input="reasonError = null"
          >
          <p v-if="reasonError" id="app-confirm-reason-error" class="mt-1.5 text-xs leading-relaxed text-error-700">
            {{ reasonError }}
          </p>
        </div>

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref="cancelRef"
            type="button"
            class="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            @click="cancel"
          >
            {{ options.cancelLabel ?? 'ยกเลิก' }}
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            :class="isDanger
              ? 'bg-error-600 hover:bg-error-700 focus-visible:outline-error-600'
              : 'bg-primary hover:bg-primary-700 focus-visible:outline-primary'"
            @click="submit"
          >
            {{ options.confirmLabel ?? 'ยืนยัน' }}
          </button>
        </div>

        <button
          type="button"
          class="absolute top-3 right-3 rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="ปิดหน้าต่างยืนยัน"
          @click="cancel"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Teleport>
</template>
