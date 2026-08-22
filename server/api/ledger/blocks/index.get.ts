import type { LedgerBlockSummary } from '../../../../shared/types/api'

export default defineEventHandler(async (event) => {
  await requireSession(event)

  const blocks = await prisma.ledgerBlock.findMany({
    include: {
      validator: true,
      events: true,
    },
    orderBy: { index: 'desc' },
  })

  const summaries: LedgerBlockSummary[] = blocks.map((b) => ({
    index: b.index,
    timestamp: b.timestamp.toISOString(),
    hash: b.hash,
    previousHash: b.previousHash,
    validatorName: b.validator.name,
    eventCount: b.events.length,
  }))

  return summaries
})
