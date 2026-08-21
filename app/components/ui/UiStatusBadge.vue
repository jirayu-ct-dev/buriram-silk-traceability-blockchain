<script setup lang="ts">
import { computed } from 'vue'
import { getStatusMeta, type StatusTone } from '~/composables/useStatusMeta'

const props = defineProps<{ status: string }>()

const meta = computed(() => getStatusMeta(props.status))

// สีตาม semantic token เท่านั้น (success/warning/error/neutral/info)
const TONE_BADGE: Record<StatusTone, string> = {
  success: 'border-success-200 bg-success-50 text-success-700',
  warning: 'border-warning-200 bg-warning-50 text-warning-800',
  error: 'border-error-200 bg-error-50 text-error-700',
  neutral: 'border-neutral-200 bg-neutral-100 text-neutral-600',
  info: 'border-info-200 bg-info-50 text-info-700',
}

const TONE_DOT: Record<StatusTone, string> = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  neutral: 'bg-neutral-400',
  info: 'bg-info-500',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
    :class="TONE_BADGE[meta.tone]"
  >
    <span class="size-1.5 shrink-0 rounded-full" :class="TONE_DOT[meta.tone]" aria-hidden="true" />
    {{ meta.label }}
  </span>
</template>
