/**
 * Contract B — DTO ของ API (source of truth: docs/teamwork/00-shared-contract.md §7)
 * คน 3 สร้าง คน 2 import ใช้ — ไฟล์นี้ทำตาม contract เป๊ะ เพื่อ unblock frontend
 * ก่อนคน 3 จะ push ของจริง
 */

export type Role = 'WEAVER' | 'COOPERATIVE_OFFICER' | 'STORE_USER'

export interface SessionUser {
  id: string
  displayName: string
  role: Role
  organizationName: string
}

export type SilkItemStatus = 'DRAFT' | 'SUBMITTED' | 'CERTIFIED' | 'REJECTED'

export interface SilkItemSummary {
  id: string
  publicId: string
  title: string
  status: SilkItemStatus
  updatedAt: string // ISO datetime
}

export interface SilkItemDetail {
  id: string
  publicId: string
  status: SilkItemStatus
  revision: {
    revisionNumber: number
    title: string
    pattern?: string
    material?: string
    technique?: string
    widthCm?: number
    lengthCm?: number
    productionDate?: string
    notes?: string
  }
  evidence: { id: string, fileName: string, sha256: string }[]
  latestReview?: {
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED'
    rejectionReasonCode?: string
    reviewNote?: string
    reviewedAt?: string
  }
}

export interface ReviewQueueItem {
  requestId: string
  silkItemPublicId: string
  revisionTitle: string
  submittedBy: string // display name ของช่างทอ
  submittedAt: string
}

export type TransferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

export interface TransferItem {
  id: string
  silkItemPublicId: string
  silkItemTitle: string
  fromOrgName: string
  toOrgName: string
  status: TransferStatus
  canResolve: boolean // ผู้ใช้ปัจจุบันมีสิทธิ์ยืนยัน/ปฏิเสธรายการนี้หรือไม่
  createdAt: string
}

export type PublicCertResult = 'VALID' | 'SUSPENDED' | 'REVOKED' | 'NOT_FOUND'

export interface PublicCertificate {
  result: PublicCertResult
  certificateCode: string
  issuedAt?: string
  silkItem: { publicId: string, title: string, pattern?: string, technique?: string }
  weaverDisplayName: string // เฉพาะชื่อที่ยินยอมเปิดเผย — ไม่มี PII อื่น
  issuerOrgName: string
  custodyTimeline: { event: string, orgName: string, at: string }[]
  hashSummary: {
    blockIndex: number
    blockHash: string
    previousHash: string
    validatorName: string
    signatureValid: boolean
  }
}

export interface LedgerBlockSummary {
  index: number
  timestamp: string
  hash: string
  previousHash: string
  validatorName: string
  eventCount: number
}

export interface LedgerBlockDetail extends LedgerBlockSummary {
  events: { eventType: string, aggregateId?: string, payload: Record<string, unknown> }[]
  signatureValid: boolean
}

// Request bodies
export interface LoginInput { username: string, password: string }
export interface CreateSilkItemInput {
  title: string
  pattern?: string
  material?: string
  technique?: string
  widthCm?: number
  lengthCm?: number
  productionDate?: string
  notes?: string
}
export interface SubmitInput { idempotencyKey: string }
export interface ReviewDecisionInput { note?: string, reasonCode?: string }
export interface CertificateStatusInput { action: 'SUSPEND' | 'REACTIVATE' | 'REVOKE', reason: string }
export interface CreateTransferInput { silkItemId: string, toOrgId: string }

// Error response กลาง
export interface ApiError { code: string, message: string, fieldErrors?: Record<string, string> }
