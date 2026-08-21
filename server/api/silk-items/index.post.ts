import { z } from 'zod'

const createSilkItemSchema = z.object({
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
  const body = await readBody(event)

  const parsed = createSilkItemSchema.safeParse(body)
  if (!parsed.success) {
    throw createApiError('VALIDATION_FAILED', 'ข้อมูลนำเข้าไม่ถูกต้อง', 400)
  }

  if (!dbUser.organizationId) {
    throw createApiError('FORBIDDEN', 'ช่างทอต้องมีสังกัดสหกรณ์ในการลงทะเบียน', 403)
  }

  const { title, pattern, material, technique, widthCm, lengthCm, productionDate, notes } = parsed.data

  let publicId = ''
  let isUnique = false
  while (!isUnique) {
    const rand = Math.floor(100000 + Math.random() * 900000).toString()
    publicId = `SI-${rand}`
    const existing = await prisma.silkItem.findUnique({
      where: { publicId },
    })
    if (!existing) {
      isUnique = true
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const newItem = await tx.silkItem.create({
      data: {
        publicId,
        ownerUserId: dbUser.id,
        custodianOrgId: dbUser.organizationId!,
      },
    })

    const revision = await tx.silkItemRevision.create({
      data: {
        silkItemId: newItem.id,
        revisionNumber: 1,
        status: 'DRAFT',
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

    await createAuditLog(tx, newItem.id, 'REVISION_CREATED', dbUser.id, {
      revisionNumber: 1,
      title,
    })

    return {
      id: newItem.id,
      publicId: newItem.publicId,
      status: 'DRAFT' as const,
      revision: {
        revisionNumber: revision.revisionNumber,
        title: revision.title,
      },
    }
  })

  return result
})
