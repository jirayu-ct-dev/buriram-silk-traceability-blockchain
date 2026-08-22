import type { Prisma } from '../../../app/generated/prisma/client.js'
import type { SilkItemDetail, SilkItemStatus } from '../../../shared/types/api'

type SilkItemWithRelations = Prisma.SilkItemGetPayload<{
  include: {
    revisions: {
      include: {
        evidence: true
        certificationRequest: true
      }
    }
    certificate: true
  }
}>

export default defineEventHandler(async (event) => {
  const dbUser = await requireSession(event)
  const idParam = getRouterParam(event, 'id')

  if (!idParam) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีของผ้าไหม', 400)
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam)

  const item = (await prisma.silkItem.findFirst({
    where: isUuid
      ? { id: idParam }
      : { publicId: idParam },
    include: {
      revisions: {
        orderBy: { revisionNumber: 'desc' },
        include: {
          evidence: true,
          certificationRequest: true,
        },
      },
      certificate: true,
    },
  })) as SilkItemWithRelations | null

  if (!item) {
    throw createApiError('NOT_FOUND', 'ไม่พบข้อมูลผ้าไหมที่ระบุ', 404)
  }

  // Check role permissions
  if (dbUser.role === 'WEAVER') {
    if (item.ownerUserId !== dbUser.id) {
      throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลผ้าไหมรายการนี้', 403)
    }
  } else if (dbUser.role === 'STORE_USER') {
    if (item.custodianOrgId !== dbUser.organizationId) {
      throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลเนื่องจากไม่ได้เป็นผู้ดูแลปัจจุบัน', 403)
    }
  } else if (dbUser.role !== 'COOPERATIVE_OFFICER') {
    throw createApiError('FORBIDDEN', 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403)
  }

  const latestRevision = item.revisions[0]
  if (!latestRevision) {
    throw createApiError('INTERNAL_SERVER_ERROR', 'ไม่พบประวัติการแก้ไขของผ้าไหมรายการนี้', 500)
  }

  // Calculate status
  let status: SilkItemStatus = 'DRAFT'
  if (item.certificate) {
    if (item.certificate.status === 'ACTIVE') {
      status = 'CERTIFIED'
    } else if (item.certificate.status === 'SUSPENDED') {
      status = 'CERTIFIED'
    } else if (item.certificate.status === 'REVOKED') {
      status = 'REJECTED'
    }
  } else {
    if (latestRevision.status === 'SUBMITTED') {
      status = 'SUBMITTED'
    } else if (latestRevision.status === 'REJECTED') {
      status = 'REJECTED'
    } else if (latestRevision.status === 'APPROVED') {
      status = 'CERTIFIED'
    } else {
      status = 'DRAFT'
    }
  }

  const latestReviewRequest = latestRevision.certificationRequest
  const latestReview = latestReviewRequest
    ? {
        status: latestReviewRequest.status as 'SUBMITTED' | 'APPROVED' | 'REJECTED',
        rejectionReasonCode: latestReviewRequest.rejectionReasonCode || undefined,
        reviewNote: latestReviewRequest.reviewNote || undefined,
        reviewedAt: latestReviewRequest.reviewedAt?.toISOString() || undefined,
      }
    : undefined

  const detail: SilkItemDetail = {
    id: item.id,
    publicId: item.publicId,
    status,
    revision: {
      revisionNumber: latestRevision.revisionNumber,
      title: latestRevision.title,
      pattern: latestRevision.pattern || undefined,
      material: latestRevision.material || undefined,
      technique: latestRevision.technique || undefined,
      widthCm: latestRevision.widthCm ? Number(latestRevision.widthCm) : undefined,
      lengthCm: latestRevision.lengthCm ? Number(latestRevision.lengthCm) : undefined,
      productionDate: latestRevision.productionDate?.toISOString() || undefined,
      notes: latestRevision.notes || undefined,
    },
    evidence: latestRevision.evidence.map((ev) => ({
      id: ev.id,
      fileName: ev.fileName,
      sha256: ev.sha256,
    })),
    latestReview,
  }

  return detail
})
