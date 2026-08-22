export default defineEventHandler(async (event) => {
  const dbUser = await requireRole(event, 'WEAVER')
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีของผ้าไหม', 400)
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam)

  const item = await prisma.silkItem.findFirst({
    where: isUuid ? { id: idParam } : { publicId: idParam },
    include: {
      revisions: {
        orderBy: { revisionNumber: 'desc' },
        take: 1,
      },
    },
  })

  if (!item) {
    throw createApiError('NOT_FOUND', 'ไม่พบข้อมูลผ้าไหมที่ระบุ', 404)
  }

  if (item.ownerUserId !== dbUser.id) {
    throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์จัดการข้อมูลผ้าไหมรายการนี้', 403)
  }

  const latestRevision = item.revisions[0]
  if (!latestRevision) {
    throw createApiError('INTERNAL_SERVER_ERROR', 'ไม่พบประวัติการแก้ไขของผ้าไหมรายการนี้', 500)
  }

  if (latestRevision.status !== 'REJECTED') {
    throw createApiError(
      'INVALID_STATE',
      'สามารถสร้างฉบับแก้ไขใหม่ได้เฉพาะรายการที่ถูกปฏิเสธเท่านั้น',
      409
    )
  }

  const nextRevisionNumber = latestRevision.revisionNumber + 1

  try {
    const result = await prisma.$transaction(async (tx) => {
      const newRevision = await tx.silkItemRevision.create({
        data: {
          silkItemId: item.id,
          revisionNumber: nextRevisionNumber,
          status: 'DRAFT',
          title: latestRevision.title,
          pattern: latestRevision.pattern,
          material: latestRevision.material,
          technique: latestRevision.technique,
          widthCm: latestRevision.widthCm,
          lengthCm: latestRevision.lengthCm,
          productionDate: latestRevision.productionDate,
          notes: latestRevision.notes,
        },
      })

      await tx.silkItem.update({
        where: { id: item.id },
        data: { updatedAt: new Date() },
      })

      await createAuditLog(tx, item.id, 'REVISION_CREATED', dbUser.id, {
        revisionNumber: nextRevisionNumber,
        basedOnRevisionId: latestRevision.id,
        source: 'REJECTED_RESUBMIT',
      })

      return {
        id: item.id,
        publicId: item.publicId,
        revisionId: newRevision.id,
        revisionNumber: newRevision.revisionNumber,
        status: 'DRAFT' as const,
      }
    })

    return result
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      throw createApiError('CONFLICT', 'มีฉบับแก้ไขเลขที่นี้อยู่แล้ว กรุณาลองใหม่', 409)
    }
    throw error
  }
})
