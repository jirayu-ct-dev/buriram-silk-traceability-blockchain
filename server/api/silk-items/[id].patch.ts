import { z } from 'zod'

const updateSilkItemSchema = z.object({
  title: z.string().min(1, 'กรุณาระบุชื่อผ้าไหม'),
  pattern: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  technique: z.string().optional().nullable(),
  widthCm: z.number().positive().optional().nullable(),
  lengthCm: z.number().positive().optional().nullable(),
  productionDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

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

  if (latestRevision.status !== 'DRAFT') {
    throw createApiError(
      'INVALID_STATE',
      'ไม่สามารถแก้ไขข้อมูลได้ เนื่องจากรายการไม่ได้อยู่ในสถานะแบบร่าง (DRAFT)',
      409
    )
  }

  const body = await readBody(event)
  const parsed = updateSilkItemSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_FAILED', 'ข้อมูลนำเข้าไม่ถูกต้อง', 400)
  }

  const { title, pattern, material, technique, widthCm, lengthCm, productionDate, notes } = parsed.data

  const result = await prisma.$transaction(async (tx) => {
    const updatedRevision = await tx.silkItemRevision.update({
      where: { id: latestRevision.id },
      data: {
        title,
        pattern: pattern || null,
        material: material || null,
        technique: technique || null,
        widthCm: widthCm || null,
        lengthCm: lengthCm || null,
        productionDate: productionDate ? new Date(productionDate) : null,
        notes: notes || null,
      },
    })

    // Trigger update time on SilkItem itself
    await tx.silkItem.update({
      where: { id: item.id },
      data: { updatedAt: new Date() },
    })

    await createAuditLog(tx, item.id, 'REVISION_CREATED', dbUser.id, {
      revisionNumber: latestRevision.revisionNumber,
      title,
      isUpdate: true,
    })

    return {
      id: item.id,
      publicId: item.publicId,
      revision: {
        revisionNumber: updatedRevision.revisionNumber,
        title: updatedRevision.title,
      },
    }
  })

  return result
})
