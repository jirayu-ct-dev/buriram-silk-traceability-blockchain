import QRCode from 'qrcode'

export default defineEventHandler(async (event) => {
  const certId = getRouterParam(event, 'id')

  if (!certId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุไอดีของใบรับรอง', 400)
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(certId)

  const cert = await prisma.certificate.findFirst({
    where: isUuid ? { id: certId } : { certificateCode: certId },
  })

  if (!cert) {
    throw createApiError('NOT_FOUND', 'ไม่พบข้อมูลใบรับรองที่ระบุ', 404)
  }

  const host = getRequestHost(event)
  const protocol = getRequestProtocol(event)
  const url = `${protocol}://${host}/certificate/${cert.certificateCode}`

  const pngBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: 256,
    margin: 2,
  })

  setResponseHeader(event, 'Content-Type', 'image/png')
  return pngBuffer
})
