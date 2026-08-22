import type { PublicCertificate, PublicCertResult } from '../../../../shared/types/api'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุรหัสใบรับรอง', 400)
  }

  const cert = await prisma.certificate.findUnique({
    where: { certificateCode: code },
    include: {
      silkItem: {
        include: {
          ownerUser: true,
          revisions: {
            orderBy: { revisionNumber: 'desc' },
            take: 1,
          },
        },
      },
      issuingOrg: true,
    },
  })

  if (!cert) {
    // ตาม Contract B คืนโครงสร้างแบบ NOT_FOUND (ไม่ 404 error เสมอไป หรือคืน 200 พร้อม result: NOT_FOUND)
    const notFoundDto: PublicCertificate = {
      result: 'NOT_FOUND',
      certificateCode: code,
      silkItem: { publicId: '', title: '' },
      weaverDisplayName: '',
      issuerOrgName: '',
      custodyTimeline: [],
      hashSummary: {
        blockIndex: 0,
        blockHash: '',
        previousHash: '',
        validatorName: '',
        signatureValid: false,
      },
    }
    return notFoundDto
  }

  const item = cert.silkItem
  const latestRevision = item.revisions[0]
  if (!latestRevision) {
    throw createApiError('INTERNAL_SERVER_ERROR', 'ไม่พบประวัติการแก้ไขของผ้าไหมรายการนี้', 500)
  }

  let resultStatus: PublicCertResult = 'VALID'
  if (cert.status === 'SUSPENDED') {
    resultStatus = 'SUSPENDED'
  } else if (cert.status === 'REVOKED') {
    resultStatus = 'REVOKED'
  }

  // ดึง block ล่าสุดที่มี event ของ silk item นี้
  const latestEvent = await prisma.ledgerEvent.findFirst({
    where: { aggregateId: item.publicId },
    include: {
      block: {
        include: { validator: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const hashSummary = latestEvent
    ? {
        blockIndex: latestEvent.block.index,
        blockHash: latestEvent.block.hash,
        previousHash: latestEvent.block.previousHash,
        validatorName: latestEvent.block.validator.name,
        signatureValid: true, // mock status ใน stub, signatureValid เสมอ
      }
    : {
        blockIndex: 0,
        blockHash: 'genesis_block_hash',
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        validatorName: 'Cooperative Authority Mock',
        signatureValid: true,
      }

  // สร้าง custody timeline
  const custodyTimeline: { event: string; orgName: string; at: string }[] = []

  // 1. เริ่มต้น: ออกใบรับรองโดยสหกรณ์
  custodyTimeline.push({
    event: 'ออกใบรับรองแหล่งที่มาผ้าไหมบุรีรัมย์',
    orgName: cert.issuingOrg.name,
    at: cert.issuedAt.toISOString(),
  })

  // 2. ประวัติการส่งมอบสิทธิ์ครอบครอง
  const transfers = await prisma.custodyTransfer.findMany({
    where: {
      silkItemId: item.id,
      status: 'ACCEPTED',
    },
    include: {
      toOrg: true,
    },
    orderBy: { resolvedAt: 'asc' },
  })

  for (const t of transfers) {
    custodyTimeline.push({
      event: 'รับมอบสิทธิ์ครอบครองสินค้าทอมือ',
      orgName: t.toOrg.name,
      at: t.resolvedAt ? t.resolvedAt.toISOString() : t.updatedAt.toISOString(),
    })
  }

  const responseDto: PublicCertificate = {
    result: resultStatus,
    certificateCode: cert.certificateCode,
    issuedAt: cert.issuedAt.toISOString(),
    silkItem: {
      publicId: item.publicId,
      title: latestRevision.title,
      pattern: latestRevision.pattern || undefined,
      technique: latestRevision.technique || undefined,
    },
    weaverDisplayName: item.ownerUser.displayName, // ตัด PII คืนเฉพาะ display name
    issuerOrgName: cert.issuingOrg.name,
    custodyTimeline,
    hashSummary,
  }

  return responseDto
})
