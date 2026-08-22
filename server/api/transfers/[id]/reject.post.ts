export default defineEventHandler(async (event) => {
  const dbUser = await requireSession(event)
  const transferId = getRouterParam(event, 'id')

  if (!transferId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีของรายการส่งมอบ', 400)
  }

  if (!dbUser.organizationId) {
    throw createApiError('FORBIDDEN', 'ผู้ใช้งานที่ไม่มีสังกัดองค์กรไม่สามารถดำเนินการปฏิเสธการรับมอบได้', 403)
  }

  const transfer = await prisma.custodyTransfer.findUnique({
    where: { id: transferId },
    include: {
      silkItem: true,
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
    throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์กดยืนยันการปฏิเสธการรับมอบแทนองค์กรปลายทาง', 403)
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedTransfer = await tx.custodyTransfer.update({
      where: { id: transferId },
      data: {
        status: 'REJECTED',
        resolvedByUserId: dbUser.id,
        resolvedAt: new Date(),
      },
    })

    await tx.silkItem.update({
      where: { id: transfer.silkItemId },
      data: { updatedAt: new Date() },
    })

    await createAuditLog(tx, transfer.silkItemId, 'TRANSFER_REJECTED', dbUser.id, {
      transferId: transfer.id,
      fromOrgName: transfer.fromOrg.name,
      toOrgName: transfer.toOrg.name,
    })

    return {
      success: true,
      transferId: updatedTransfer.id,
      status: updatedTransfer.status,
    }
  })

  return result
})
