import { appendEvents } from '../../../services/ledger.service'

export default defineEventHandler(async (event) => {
  const dbUser = await requireSession(event)
  const transferId = event.context.params?.id

  if (!transferId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีของรายการส่งมอบ', 400)
  }

  if (!dbUser.organizationId) {
    throw createApiError('FORBIDDEN', 'ผู้ใช้งานที่ไม่มีสังกัดองค์กรไม่สามารถดำเนินการรับมอบได้', 403)
  }

  const transfer = await prisma.custodyTransfer.findUnique({
    where: { id: transferId },
    include: {
      silkItem: {
        include: { certificate: true },
      },
      fromOrg: true,
      toOrg: true,
    },
  })

  if (!transfer) {
    throw createApiError('NOT_FOUND', 'ไม่พบรายการส่งมอบที่ระบุ', 404)
  }

  if (transfer.status !== 'PENDING') {
    throw createApiError('INVALID_STATE', 'รายการส่งมอบนี้ได้รับการดำเนินการไปแล้ว', 409)
  }

  if (transfer.toOrgId !== dbUser.organizationId) {
    throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์กดยืนยันการรับมอบแทนองค์กรปลายทาง', 403)
  }

  const cert = transfer.silkItem.certificate
  if (!cert || cert.status !== 'ACTIVE') {
    throw createApiError(
      'INVALID_STATE',
      'ไม่สามารถรับมอบได้ เนื่องจากผ้าไหมนี้ไม่มีใบรับรอง หรือใบรับรองถูกระงับ/เพิกถอนไปแล้ว',
      409
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedTransfer = await tx.custodyTransfer.update({
      where: { id: transferId },
      data: {
        status: 'ACCEPTED',
        resolvedByUserId: dbUser.id,
        resolvedAt: new Date(),
      },
    })

    await tx.silkItem.update({
      where: { id: transfer.silkItemId },
      data: {
        custodianOrgId: transfer.toOrgId,
        updatedAt: new Date(),
      },
    })

    const appendResult = await appendEvents(tx, [
      {
        eventType: 'TRANSFER_ACCEPTED',
        aggregateId: transfer.silkItem.publicId,
        actorId: dbUser.id,
        payload: {
          transferId: transfer.id,
          fromOrgName: transfer.fromOrg.name,
          toOrgName: transfer.toOrg.name,
        },
      },
    ])

    await createAuditLog(tx, transfer.silkItemId, 'TRANSFER_ACCEPTED', dbUser.id, {
      transferId: transfer.id,
      fromOrgName: transfer.fromOrg.name,
      toOrgName: transfer.toOrg.name,
      blockIndex: appendResult.blockIndex,
    })

    return {
      success: true,
      transferId: updatedTransfer.id,
      status: updatedTransfer.status,
      blockIndex: appendResult.blockIndex,
    }
  })

  return result
})
