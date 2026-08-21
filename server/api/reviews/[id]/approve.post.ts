import { appendEvents } from '../../../services/ledger.service'

export default defineEventHandler(async (event) => {
  const dbUser = await requireRole(event, 'COOPERATIVE_OFFICER')
  const requestId = event.context.params?.id

  if (!requestId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีของคำขอ', 400)
  }

  if (!dbUser.organizationId) {
    throw createApiError('FORBIDDEN', 'เจ้าหน้าที่ต้องมีสังกัดองค์กรในการอนุมัติใบรับรอง', 403)
  }

  const request = await prisma.certificationRequest.findUnique({
    where: { id: requestId },
    include: {
      silkItem: {
        include: { certificate: true },
      },
      revision: true,
    },
  })

  if (!request) {
    throw createApiError('NOT_FOUND', 'ไม่พบคำขอตรวจสอบที่ระบุ', 404)
  }

  if (request.status !== 'SUBMITTED') {
    throw createApiError('INVALID_STATE', 'คำขอนี้ได้รับการดำเนินการไปแล้ว', 409)
  }

  const existingCert = request.silkItem.certificate
  if (existingCert && existingCert.status === 'ACTIVE') {
    throw createApiError('CERTIFICATE_ALREADY_EXISTS', 'ผ้าไหมรายการนี้มีใบรับรองที่ยังใช้งานได้อยู่แล้ว', 409)
  }

  let certificateCode = ''
  let isUnique = false
  while (!isUnique) {
    const rand = Math.floor(100000 + Math.random() * 900000).toString()
    certificateCode = `BR-SILK-${rand}`
    const existing = await prisma.certificate.findUnique({
      where: { certificateCode },
    })
    if (!existing) {
      isUnique = true
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.certificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedByUserId: dbUser.id,
        reviewedAt: new Date(),
      },
    })

    await tx.silkItemRevision.update({
      where: { id: request.revisionId },
      data: { status: 'APPROVED' },
    })

    await tx.certificate.create({
      data: {
        certificateCode,
        silkItemId: request.silkItemId,
        revisionId: request.revisionId,
        issuingOrgId: dbUser.organizationId!,
        issuedByUserId: dbUser.id,
        status: 'ACTIVE',
      },
    })

    await tx.silkItem.update({
      where: { id: request.silkItemId },
      data: { updatedAt: new Date() },
    })

    const appendResult = await appendEvents(tx, [
      {
        eventType: 'ISSUE_CERTIFICATE',
        aggregateId: request.silkItem.publicId,
        actorId: dbUser.id,
        payload: {
          certificateCode,
          revisionNumber: request.revision.revisionNumber,
          requestId: request.id,
        },
      },
    ])

    await createAuditLog(tx, request.silkItemId, 'CERTIFICATION_APPROVED', dbUser.id, {
      requestId: request.id,
      certificateCode,
      blockIndex: appendResult.blockIndex,
    })

    return {
      success: true,
      certificateCode,
      blockIndex: appendResult.blockIndex,
    }
  })

  return result
})
