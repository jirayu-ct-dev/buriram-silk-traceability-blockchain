import { z } from 'zod'

const rejectSchema = z.object({
  reasonCode: z.string().min(1, 'กรุณาระบุรหัสเหตุผลการปฏิเสธ'),
  reviewNote: z.string().min(1, 'กรุณาระบุบันทึกรายละเอียดการปฏิเสธ'),
})

export default defineEventHandler(async (event) => {
  const dbUser = await requireRole(event, 'COOPERATIVE_OFFICER')
  const requestId = getRouterParam(event, 'id')

  if (!requestId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีของคำขอ', 400)
  }

  const body = await readBody(event)
  const parsed = rejectSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_FAILED', 'ข้อมูลนำเข้าไม่ถูกต้อง', 400)
  }

  const { reasonCode, reviewNote } = parsed.data

  const request = await prisma.certificationRequest.findUnique({
    where: { id: requestId },
    include: {
      silkItem: true,
      revision: true,
    },
  })

  if (!request) {
    throw createApiError('NOT_FOUND', 'ไม่พบคำขอตรวจสอบที่ระบุ', 404)
  }

  if (request.status !== 'SUBMITTED') {
    throw createApiError('INVALID_STATE', 'คำขอนี้ได้รับการดำเนินการไปแล้ว', 409)
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.certificationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedByUserId: dbUser.id,
        reviewedAt: new Date(),
        rejectionReasonCode: reasonCode,
        reviewNote: reviewNote,
      },
    })

    await tx.silkItemRevision.update({
      where: { id: request.revisionId },
      data: { status: 'REJECTED' },
    })

    await tx.silkItem.update({
      where: { id: request.silkItemId },
      data: { updatedAt: new Date() },
    })

    await createAuditLog(tx, request.silkItemId, 'CERTIFICATION_REJECTED', dbUser.id, {
      requestId: request.id,
      reasonCode,
      reviewNote,
    })

    return {
      success: true,
      requestId: updatedRequest.id,
      status: updatedRequest.status,
    }
  })

  return result
})
