export default defineEventHandler(async (event) => {
  await requireSession(event)

  const silkItemId = getRouterParam(event, 'silkItemId')

  if (!silkItemId) {
    throw createApiError('BAD_REQUEST', 'กรุณาระบุรหัสผ้าไหม', 400)
  }

  const item = await prisma.silkItem.findFirst({
    where: {
      OR: [
        { id: silkItemId },
        { publicId: silkItemId },
      ],
    },
  })

  if (!item) {
    throw createApiError('NOT_FOUND', 'ไม่พบข้อมูลผ้าไหมที่ระบุ', 404)
  }

  const logs = await prisma.auditLog.findMany({
    where: { silkItemId: item.id },
    include: {
      actorUser: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  const entries = logs.map((log) => ({
    at: log.createdAt.toISOString(),
    actor: log.actorUser ? `${log.actorUser.displayName} (${log.actorUser.role})` : 'ระบบ',
    action: log.action,
    detail: log.details ? JSON.stringify(log.details) : '',
  }))

  return entries
})
