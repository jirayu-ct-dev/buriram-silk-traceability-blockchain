export type StatusTone = 'success' | 'warning' | 'error' | 'neutral' | 'info'

export interface StatusMeta {
  label: string
  tone: StatusTone
}

// ครอบคลุม enum สถานะทั้งหมดตาม Contract C (00-shared-contract §8)
// กติกา §5.3: status ต้องมีข้อความไทยกำกับเสมอ — ห้ามใช้สีอย่างเดียว
export const STATUS_META: Record<string, StatusMeta> = {
  // Silk item / Revision / Review request
  DRAFT: { label: 'ฉบับร่าง', tone: 'neutral' },
  SUBMITTED: { label: 'รอตรวจ', tone: 'warning' },
  APPROVED: { label: 'อนุมัติแล้ว', tone: 'success' },
  REJECTED: { label: 'ถูกปฏิเสธ', tone: 'error' },
  CERTIFIED: { label: 'ได้รับใบรับรอง', tone: 'success' },

  // Certificate
  ACTIVE: { label: 'ใช้งาน', tone: 'success' },
  SUSPENDED: { label: 'ระงับชั่วคราว', tone: 'warning' },
  REVOKED: { label: 'เพิกถอนแล้ว', tone: 'error' },

  // Custody transfer
  PENDING: { label: 'รอยืนยัน', tone: 'warning' },
  ACCEPTED: { label: 'ยืนยันรับแล้ว', tone: 'success' },
  CANCELLED: { label: 'ยกเลิกแล้ว', tone: 'neutral' },
  EXPIRED: { label: 'หมดอายุ', tone: 'neutral' },

  // Public verification result (§12)
  VALID: { label: 'ผ่านการตรวจสอบ', tone: 'success' },
  CHAIN_INVALID: { label: 'ห่วงโซ่ไม่สมบูรณ์', tone: 'error' },
  NOT_FOUND: { label: 'ไม่พบข้อมูล', tone: 'neutral' },
}

export const UNKNOWN_STATUS_META: StatusMeta = { label: 'ไม่ทราบสถานะ', tone: 'neutral' }

export const getStatusMeta = (status: string): StatusMeta =>
  STATUS_META[status] ?? UNKNOWN_STATUS_META
