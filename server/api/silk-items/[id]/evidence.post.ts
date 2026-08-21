import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const UPLOAD_DIR = path.resolve(process.cwd(), 'storage/uploads')

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

  if (latestRevision.status !== 'DRAFT') {
    throw createApiError(
      'INVALID_STATE',
      'ไม่สามารถแนบหลักฐานเพิ่มเติมได้ เนื่องจากรายการไม่ได้อยู่ในสถานะแบบร่าง (DRAFT)',
      409
    )
  }

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createApiError('BAD_REQUEST', 'กรุณาอัปโหลดไฟล์หลักฐาน', 400)
  }

  const filePart = parts.find((p) => p.name === 'file' || p.name === 'evidence')
  if (!filePart || !filePart.data || !filePart.filename) {
    throw createApiError('BAD_REQUEST', 'ไม่พบข้อมูลไฟล์ที่ส่งมา', 400)
  }

  const fileName = filePart.filename
  const mimeType = filePart.type || 'application/octet-stream'
  const fileData = filePart.data
  const fileSizeBytes = fileData.length

  if (fileSizeBytes > 10 * 1024 * 1024) {
    throw createApiError('BAD_REQUEST', 'ขนาดไฟล์ใหญ่เกินกว่า 10MB', 400)
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  if (!allowedMimeTypes.includes(mimeType)) {
    throw createApiError('BAD_REQUEST', 'อนุญาตให้อัปโหลดเฉพาะไฟล์ JPG, PNG และ PDF เท่านั้น', 400)
  }

  const sha256 = crypto.createHash('sha256').update(fileData).digest('hex')

  const fileExt = path.extname(fileName)
  const fileUuid = crypto.randomUUID()
  const savedFileName = `${fileUuid}${fileExt}`
  const filePath = path.join(UPLOAD_DIR, savedFileName)

  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  await fs.writeFile(filePath, fileData)

  const result = await prisma.$transaction(async (tx) => {
    const evidence = await tx.evidence.create({
      data: {
        revisionId: latestRevision.id,
        fileName,
        filePath: savedFileName,
        mimeType,
        fileSizeBytes,
        sha256,
        uploadedByUserId: dbUser.id,
      },
    })

    await tx.silkItem.update({
      where: { id: item.id },
      data: { updatedAt: new Date() },
    })

    await createAuditLog(tx, item.id, 'EVIDENCE_UPLOADED', dbUser.id, {
      evidenceId: evidence.id,
      fileName,
      sha256,
    })

    return {
      id: evidence.id,
      fileName: evidence.fileName,
      sha256: evidence.sha256,
    }
  })

  return result
})
