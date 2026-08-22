export default defineEventHandler(async (event) => {
  await requireRole(event, 'COOPERATIVE_OFFICER')

  const requestId = getRouterParam(event, 'id')
  if (!requestId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุรหัสคำขอ', 400)
  }

  const request = await prisma.certificationRequest.findUnique({
    where: { id: requestId },
    include: {
      silkItem: true,
      revision: true,
      submittedBy: true,
    },
  })

  if (!request) {
    throw createApiError('NOT_FOUND', 'ไม่พบคำขอรับรอง', 404)
  }

  const evidence = await prisma.evidence.findMany({
    where: { revisionId: request.revisionId },
  })

  return {
    requestId: request.id,
    silkItemPublicId: request.silkItem.publicId,
    title: request.revision.title,
    pattern: request.revision.pattern,
    material: request.revision.material,
    technique: request.revision.technique,
    widthCm: request.revision.widthCm ? Number(request.revision.widthCm) : undefined,
    lengthCm: request.revision.lengthCm ? Number(request.revision.lengthCm) : undefined,
    notes: request.revision.notes,
    submittedBy: request.submittedBy.displayName,
    submittedAt: request.createdAt.toISOString(),
    evidence: evidence.map((e) => ({
      id: e.id,
      fileName: e.fileName,
      sha256: e.sha256,
    })),
  }
})
