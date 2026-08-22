export default defineEventHandler(async (event) => {
  await requireRole(event, 'COOPERATIVE_OFFICER')

  const certId = getRouterParam(event, 'id')
  if (!certId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุรหัสใบรับรอง', 400)
  }

  const certificate = await prisma.certificate.findFirst({
    where: {
      OR: [
        { id: certId },
        { certificateCode: certId },
      ],
    },
    include: {
      silkItem: true,
      revision: true,
    },
  })

  if (!certificate) {
    throw createApiError('NOT_FOUND', 'ไม่พบใบรับรอง', 404)
  }

  return {
    id: certificate.id,
    certificateCode: certificate.certificateCode,
    silkItemPublicId: certificate.silkItem.publicId,
    title: certificate.revision.title,
    status: certificate.status,
    statusReason: certificate.statusReason,
    statusChangedAt: certificate.statusChangedAt?.toISOString() ?? null,
    issuedAt: certificate.issuedAt.toISOString(),
  }
})
