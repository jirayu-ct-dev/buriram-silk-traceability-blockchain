import type { Prisma } from '../../../app/generated/prisma/client.js'
import type { SilkItemSummary, SilkItemStatus } from '../../../shared/types/api'

export default defineEventHandler(async (event) => {
  const dbUser = await requireSession(event)
  const role = dbUser.role

  const whereClause: Prisma.SilkItemWhereInput = {}

  if (role === 'WEAVER') {
    whereClause.ownerUserId = dbUser.id
  } else if (role === 'STORE_USER') {
    if (!dbUser.organizationId) {
      throw createApiError('FORBIDDEN', 'ผู้ใช้งานไม่มีความผูกพันกับองค์กรใดๆ', 403)
    }
    whereClause.custodianOrgId = dbUser.organizationId
  } else if (role !== 'COOPERATIVE_OFFICER') {
    throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403)
  }

  const items = await prisma.silkItem.findMany({
    where: whereClause,
    include: {
      revisions: {
        orderBy: { revisionNumber: 'desc' },
        take: 1,
      },
      certificate: true,
    },
    orderBy: { updatedAt: 'desc' },
  })

  const summaryList: SilkItemSummary[] = items.map((item) => {
    let status: SilkItemStatus = 'DRAFT'

    if (item.certificate) {
      if (item.certificate.status === 'ACTIVE') {
        status = 'CERTIFIED'
      } else if (item.certificate.status === 'SUSPENDED') {
        status = 'CERTIFIED' // ยังนับเป็น CERTIFIED ในลิสต์หลัก
      } else if (item.certificate.status === 'REVOKED') {
        status = 'REJECTED' // เพิกถอนแล้วปัดเป็น REJECTED หรือจัดการตามหน้า UI
      }
    } else {
      const latestRev = item.revisions[0]
      if (latestRev) {
        if (latestRev.status === 'SUBMITTED') {
          status = 'SUBMITTED'
        } else if (latestRev.status === 'REJECTED') {
          status = 'REJECTED'
        } else if (latestRev.status === 'APPROVED') {
          status = 'CERTIFIED'
        } else {
          status = 'DRAFT'
        }
      }
    }

    return {
      id: item.id,
      publicId: item.publicId,
      title: item.revisions[0]?.title || 'ไม่ระบุชื่อ',
      status,
      certificateStatus: item.certificate?.status,
      updatedAt: item.updatedAt.toISOString(),
    }
  })

  return summaryList
})
