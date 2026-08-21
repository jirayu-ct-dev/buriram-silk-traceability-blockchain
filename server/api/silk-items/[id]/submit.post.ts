import { z } from 'zod'

const submitSchema = z.object({
  idempotencyKey: z.string().min(1, 'กรุณาระบุคีย์ป้องกันการทำงานซ้ำ (Idempotency Key)'),
})

export default defineEventHandler(async (event) => {
  const dbUser = await requireRole(event, 'WEAVER')
  const idParam = event.context.params?.id

  if (!idParam) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีของผ้าไหม', 400)
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam)

  const item = await prisma.silkItem.findFirst({
    where: isUuid ? { id: idParam } : { publicId: idParam },
    include: {
      revisions: {
        orderBy: { revisionNumber: 'desc' },
        include: { evidence: true },
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

  const body = await readBody(event)
  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_FAILED', 'ข้อมูลนำเข้าไม่ถูกต้อง', 400)
  }

  const { idempotencyKey } = parsed.data

  const existingKey = await prisma.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  })

  if (existingKey) {
    const existingRequest = await prisma.certificationRequest.findFirst({
      where: { revisionId: latestRevision.id },
    })

    return {
      success: true,
      idempotent: true,
      requestId: existingRequest?.id || '',
      status: existingRequest?.status || 'SUBMITTED',
    }
  }

  if (latestRevision.status !== 'DRAFT') {
    throw createApiError(
      'INVALID_STATE',
      'ไม่สามารถส่งคำขอรับรองได้ เนื่องจากรายการไม่ได้อยู่ในสถานะแบบร่าง (DRAFT)',
      409
    )
  }

  if (latestRevision.evidence.length === 0) {
    throw createApiError(
      'VALIDATION_FAILED',
      'กรุณาอัปโหลดเอกสารหรือรูปภาพหลักฐานอย่างน้อย 1 รายการก่อนส่งคำขอรับรอง',
      400
    )
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        action: `SUBMIT_SILK_ITEM:${item.id}`,
      },
    })

    await tx.silkItemRevision.update({
      where: { id: latestRevision.id },
      data: { status: 'SUBMITTED' },
    })

    const request = await tx.certificationRequest.create({
      data: {
        silkItemId: item.id,
        revisionId: latestRevision.id,
        status: 'SUBMITTED',
        submittedByUserId: dbUser.id,
      },
    })

    await tx.silkItem.update({
      where: { id: item.id },
      data: { updatedAt: new Date() },
    })

    await createAuditLog(tx, item.id, 'SUBMITTED_FOR_CERTIFICATION', dbUser.id, {
      revisionId: latestRevision.id,
      requestId: request.id,
    })

    return {
      success: true,
      idempotent: false,
      requestId: request.id,
      status: request.status,
    }
  })

  return result
})
