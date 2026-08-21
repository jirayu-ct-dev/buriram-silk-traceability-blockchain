import { z } from 'zod'

const createTransferSchema = z.object({
  silkItemId: z.string().uuid('รูปแบบไอดีผ้าไหมไม่ถูกต้อง'),
  toOrgId: z.string().uuid('รูปแบบไอดีองค์กรปลายทางไม่ถูกต้อง'),
})

export default defineEventHandler(async (event) => {
  const dbUser = await requireSession(event)

  if (!dbUser.organizationId) {
    throw createApiError('FORBIDDEN', 'ผู้ใช้งานที่ไม่มีสังกัดองค์กรไม่สามารถเริ่มการส่งมอบได้', 403)
  }

  const body = await readBody(event)
  const parsed = createTransferSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_FAILED', 'ข้อมูลนำเข้าไม่ถูกต้อง', 400)
  }

  const { silkItemId, toOrgId } = parsed.data

  if (dbUser.organizationId === toOrgId) {
    throw createApiError('BAD_REQUEST', 'ไม่สามารถส่งมอบให้กับองค์กรของตนเองได้', 400)
  }

  const targetOrg = await prisma.organization.findUnique({
    where: { id: toOrgId },
  })

  if (!targetOrg) {
    throw createApiError('NOT_FOUND', 'ไม่พบองค์กรปลายทางที่ระบุ', 404)
  }

  const item = await prisma.silkItem.findUnique({
    where: { id: silkItemId },
    include: { certificate: true },
  })

  if (!item) {
    throw createApiError('NOT_FOUND', 'ไม่พบข้อมูลผ้าไหมที่ระบุ', 404)
  }

  if (item.custodianOrgId !== dbUser.organizationId) {
    throw createApiError('FORBIDDEN', 'คุณไม่ได้เป็นผู้ดูแลปัจจุบัน จึงไม่สามารถเริ่มส่งมอบผ้าไหมได้', 403)
  }

  if (!item.certificate || item.certificate.status !== 'ACTIVE') {
    throw createApiError(
      'INVALID_STATE',
      'ไม่สามารถส่งมอบได้ เนื่องจากผ้าไหมนี้ไม่มีใบรับรอง หรือใบรับรองไม่อยู่ในสถานะใช้งานได้ (ACTIVE)',
      409
    )
  }

  const existingPending = await prisma.custodyTransfer.findFirst({
    where: {
      silkItemId,
      status: 'PENDING',
    },
  })

  if (existingPending) {
    throw createApiError(
      'CONFLICT',
      'ไม่สามารถเริ่มส่งมอบได้ เนื่องจากมีรายการส่งมอบที่รอการยืนยันค้างอยู่แล้วสำหรับผ้าไหมผืนนี้',
      409
    )
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.custodyTransfer.create({
        data: {
          silkItemId,
          fromOrgId: dbUser.organizationId!,
          toOrgId,
          status: 'PENDING',
          initiatedByUserId: dbUser.id,
        },
      })

      await tx.silkItem.update({
        where: { id: silkItemId },
        data: { updatedAt: new Date() },
      })

      await createAuditLog(tx, silkItemId, 'TRANSFER_INITIATED', dbUser.id, {
        transferId: transfer.id,
        fromOrgId: dbUser.organizationId,
        toOrgId,
      })

      return {
        success: true,
        transferId: transfer.id,
        status: transfer.status,
      }
    })

    return result
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      throw createApiError(
        'CONFLICT',
        'ไม่สามารถเริ่มส่งมอบได้ เนื่องจากมีรายการส่งมอบที่รอการยืนยันค้างอยู่แล้ว',
        409
      )
    }
    throw error
  }
})
