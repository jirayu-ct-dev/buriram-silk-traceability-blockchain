export default defineEventHandler(async (event) => {
  const session = await requireSession(event)

  const transferId = getRouterParam(event, 'id')
  if (!transferId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุรหัสการส่งมอบ', 400)
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
    throw createApiError('NOT_FOUND', 'ไม่พบการส่งมอบ', 404)
  }

  const latestRevision = await prisma.silkItemRevision.findFirst({
    where: { silkItemId: transfer.silkItemId },
    orderBy: { revisionNumber: 'desc' },
  })

  const orgId = session.organization?.id
  const canResolve =
    transfer.status === 'PENDING' &&
    orgId !== null &&
    transfer.toOrgId === orgId

  return {
    id: transfer.id,
    silkItemPublicId: transfer.silkItem.publicId,
    silkItemTitle: latestRevision?.title ?? '-',
    fromOrgName: transfer.fromOrg.name,
    toOrgName: transfer.toOrg.name,
    status: transfer.status,
    canResolve,
    createdAt: transfer.createdAt.toISOString(),
  }
})
