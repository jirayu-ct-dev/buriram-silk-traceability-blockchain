import type { LedgerBlockDetail } from '../../../../shared/types/api'

export default defineEventHandler(async (event) => {
  await requireSession(event)

  const indexParam = getRouterParam(event, 'index')
  const index = Number(indexParam)

  if (Number.isNaN(index) || index < 0) {
    throw createApiError('BAD_REQUEST', 'Block index ไม่ถูกต้อง', 400)
  }

  const block = await prisma.ledgerBlock.findUnique({
    where: { index },
    include: {
      validator: true,
      events: true,
    },
  })

  if (!block) {
    throw createApiError('NOT_FOUND', 'ไม่พบ block ที่ระบุนี้', 404)
  }

  const detail: LedgerBlockDetail = {
    index: block.index,
    timestamp: block.timestamp.toISOString(),
    hash: block.hash,
    previousHash: block.previousHash,
    validatorName: block.validator.name,
    eventCount: block.events.length,
    signatureValid: true,
    events: block.events.map((e) => ({
      eventType: e.eventType,
      aggregateId: e.aggregateId ?? undefined,
      payload: e.payload as Record<string, unknown>,
    })),
  }

  return detail
})
