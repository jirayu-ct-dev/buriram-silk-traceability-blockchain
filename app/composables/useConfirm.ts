import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export interface ConfirmReasonOptions extends ConfirmOptions {
  reasonLabel: string
  reasonPlaceholder?: string
}

type PendingRequest =
  | { kind: 'confirm', options: ConfirmOptions, resolve: (ok: boolean) => void }
  | { kind: 'reason', options: ConfirmReasonOptions, resolve: (reason: string | null) => void }

// state ระดับ module — dialog เดียวทั้งแอป ใครเรียก confirm ล่าสุดได้รับคำตอบจาก dialog นั้น
const pending = ref<PendingRequest | null>(null)

/** ให้ AppConfirmDialog อ่าน/ปิด request ปัจจุบัน (internal + unit test) */
export const useConfirmDialogState = () => pending

export const useConfirm = () => {
  /**
   * ยืนยัน action ที่ย้อนกลับยาก (Suspend/Revoke/Cancel Transfer — §5.3)
   * resolve true = ผู้ใช้กดยืนยัน, false = กดยกเลิกหรือกด Escape
   */
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    if (typeof window === 'undefined') return Promise.resolve(false)
    return new Promise((resolve) => {
      pending.value = { kind: 'confirm', options, resolve }
    })
  }

  /** เหมือน confirm แต่บังคับกรอกเหตุผล — resolve string ที่กรอก หรือ null เมื่อยกเลิก */
  const confirmWithReason = (options: ConfirmReasonOptions): Promise<string | null> => {
    if (typeof window === 'undefined') return Promise.resolve(null)
    return new Promise((resolve) => {
      pending.value = { kind: 'reason', options, resolve }
    })
  }

  return { confirm, confirmWithReason }
}
