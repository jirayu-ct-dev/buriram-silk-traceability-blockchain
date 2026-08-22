import { z } from 'zod'
import { appendEvents } from '../../../services/ledger.service'
import type { CertificateStatus, AuditAction, LedgerEventType } from '../../../../app/generated/prisma/client'

const statusSchema = z.object({
  action: z.enum(['SUSPEND', 'REACTIVATE', 'REVOKE']),
  reason: z.string().min(1, 'กรุณาระบุเหตุผลการเปลี่ยนสถานะใบรับรอง'),
})

export default defineEventHandler(async (event) => {
  const dbUser = await requireRole(event, 'COOPERATIVE_OFFICER')
  const certIdParam = getRouterParam(event, 'id')

  if (!certIdParam) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีหรือรหัสใบรับรอง', 400)
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(certIdParam)

  const cert = await prisma.certificate.findFirst({
    where: isUuid ? { id: certIdParam } : { certificateCode: certIdParam },
    include: { silkItem: true },
  })

  if (!cert) {
    throw createApiError('NOT_FOUND', 'ไม่พบข้อมูลใบรับรองที่ระบุ', 404)
  }

  const body = await readBody(event)
  const parsed = statusSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_FAILED', 'ข้อมูลนำเข้าไม่ถูกต้อง', 400)
  }

  const { action, reason } = parsed.data

  let targetStatus: CertificateStatus
  let auditAction: AuditAction
  let ledgerEventType: LedgerEventType

  const currentStatus = cert.status

  if (action === 'SUSPEND') {
    if (currentStatus !== 'ACTIVE') {
      throw createApiError('INVALID_STATE', 'สามารถระงับได้เฉพาะใบรับรองที่มีสถานะใช้งานอยู่ (ACTIVE) เท่านั้น', 409)
    }
    targetStatus = 'SUSPENDED'
    auditAction = 'CERTIFICATE_SUSPENDED'
    ledgerEventType = 'CERTIFICATE_SUSPENDED'
  } else if (action === 'REACTIVATE') {
    if (currentStatus !== 'SUSPENDED') {
      throw createApiError('INVALID_STATE', 'สามารถคืนสถานะได้เฉพาะใบรับรองที่ถูกระงับ (SUSPENDED) เท่านั้น', 409)
    }
    targetStatus = 'ACTIVE'
    auditAction = 'CERTIFICATE_REACTIVATED'
    ledgerEventType = 'CERTIFICATE_REACTIVATED'
  } else {
    if (currentStatus === 'REVOKED') {
      throw createApiError('INVALID_STATE', 'ใบรับรองนี้ถูกเพิกถอนถาวรไปแล้ว ไม่สามารถเปลี่ยนสถานะได้อีก', 409)
    }
    targetStatus = 'REVOKED'
    auditAction = 'CERTIFICATE_REVOKED'
    ledgerEventType = 'CERTIFICATE_REVOKED'
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedCert = await tx.certificate.update({
      where: { id: cert.id },
      data: {
        status: targetStatus,
        statusReason: reason,
        statusChangedAt: new Date(),
      },
    })

    await tx.silkItem.update({
      where: { id: cert.silkItemId },
      data: { updatedAt: new Date() },
    })

    const appendResult = await appendEvents(tx, [
      {
        eventType: ledgerEventType,
        aggregateId: cert.silkItem.publicId,
        actorId: dbUser.id,
        payload: {
          certificateCode: cert.certificateCode,
          reason,
          action,
        },
      },
    ])

    await createAuditLog(tx, cert.silkItemId, auditAction, dbUser.id, {
      certificateId: cert.id,
      certificateCode: cert.certificateCode,
      reason,
      blockIndex: appendResult.blockIndex,
    })

    return {
      success: true,
      certificateCode: cert.certificateCode,
      status: updatedCert.status,
      blockIndex: appendResult.blockIndex,
    }
  })

  return result
})
