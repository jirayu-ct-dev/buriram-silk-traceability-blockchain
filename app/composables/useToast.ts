import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

// TODO(api): คง API เดิมไว้ตอน wire backend — หน้าเรียก toast.success/error เหมือนเดิม
const TOAST_TIMEOUT_MS = 5000

// state ระดับ module — ทุกจุดที่เรียก useToast() เห็นคิวเดียวกัน
// toast เกิดจาก interaction ฝั่ง client เท่านั้น ไม่ถูก serialize ลง SSR payload
const toasts = ref<ToastItem[]>([])
let nextId = 0
const timers = new Map<number, ReturnType<typeof setTimeout>>()

export const useToast = () => {
  const dismiss = (id: number) => {
    const timer = timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter(toast => toast.id !== id)
  }

  const push = (type: ToastType, message: string) => {
    if (typeof window === 'undefined') return
    const id = ++nextId
    toasts.value = [...toasts.value, { id, type, message }]
    timers.set(
      id,
      setTimeout(() => dismiss(id), TOAST_TIMEOUT_MS),
    )
  }

  const clear = () => {
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
    toasts.value = []
  }

  return {
    toasts,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
    warning: (message: string) => push('warning', message),
    info: (message: string) => push('info', message),
    dismiss,
    clear,
  }
}
