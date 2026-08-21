<script setup lang="ts">
import { CircleCheck, CircleX, Info, TriangleAlert, X } from '@lucide/vue'
import { markRaw, type Component } from 'vue'
import type { ToastType } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

interface ToastStyle {
  icon: Component
  barClass: string
}

// สีตาม semantic token — ห้าม hard-code palette
const STYLES: Record<ToastType, ToastStyle> = {
  success: { icon: markRaw(CircleCheck), barClass: 'bg-success-600' },
  error: { icon: markRaw(CircleX), barClass: 'bg-error-600' },
  warning: { icon: markRaw(TriangleAlert), barClass: 'bg-warning-600' },
  info: { icon: markRaw(Info), barClass: 'bg-info-600' },
}
</script>

<template>
  <!-- z-index สูงกว่า header (z-30/z-40) และ overlay ของ drawer/dialog -->
  <div
    class="pointer-events-none fixed top-4 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
    aria-live="polite"
  >
    <TransitionGroup
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        role="status"
        class="pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 text-white shadow-lg"
        :class="STYLES[toast.type].barClass"
      >
        <component :is="STYLES[toast.type].icon" class="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <p class="min-w-0 flex-1 text-sm leading-relaxed break-words">
          {{ toast.message }}
        </p>
        <button
          type="button"
          class="-m-1 shrink-0 rounded-md p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="ปิดการแจ้งเตือน"
          @click="dismiss(toast.id)"
        >
          <X class="size-4" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
