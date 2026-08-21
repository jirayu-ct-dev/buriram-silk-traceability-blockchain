import type { TransferItem } from '../../../shared/types/api'

export default defineEventHandler(async (event) => {
  const dbUser = await requireSession(event)

  if (!dbUser.organizationId) {
    throw createApiError('FORBIDDEN', 'ผู้ใช้งานที่ไม่มีสังกัดองค์กรไม่สามารถเข้าถึงรายการส่งมอบได้', 403)
  }

  const orgId = dbUser.organizationId

  const transfers = await prisma.custodyTransfer.findMany({
    where: {
      OR: [
        { fromOrgId: orgId },
        { toOrgId: orgId },
      ],
    },
    include: {
      silkItem: {
        include: {
          revisions: {
            orderBy: { revisionNumber: 'desc' },
            take: 1,
          },
        },
      },
      fromOrg: true,
      toOrg: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const list: TransferItem[] = transfers.map((t) => {
    const title = t.silkItem.revisions[0]?.title || 'ไม่ระบุชื่อ'
    const canResolve = t.toOrgId === orgId && t.status === 'PENDING'

    return {
      id: t.id,
      silkItemPublicId: t.silkItem.publicId,
      silkItemTitle: title,
      fromOrgName: t.fromOrg.name,
      toOrgName: t.toOrg.name,
      status: t.status as 'PENDING' | 'ACCEPTED' | 'REJECTED',
      canResolve,
      createdAt: t.createdAt.toISOString(),
    }
  })

  return list
})
