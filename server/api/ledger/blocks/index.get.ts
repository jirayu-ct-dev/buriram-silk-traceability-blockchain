/**
 * GET /api/ledger/blocks
 *
 * Public endpoint — returns LedgerBlockSummary[] sorted by index descending.
 * Supports simple pagination: ?limit=50&before=<index>
 * No PII is returned — no actorId or raw payloads.
 */
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  // Parse pagination params
  const limit = Math.min(Number(query.limit) || 50, 100)
  const before = query.before !== undefined ? Number(query.before) : undefined

  const whereClause = before !== undefined && !Number.isNaN(before)
    ? { index: { lt: before } }
    : undefined

  const blocks = await prisma.ledgerBlock.findMany({
    where: whereClause,
    orderBy: { index: 'desc' },
    take: limit,
    include: {
      validator: { select: { name: true } },
      _count: { select: { events: true } },
    },
  })

  return blocks.map(block => ({
    index: block.index,
    timestamp: block.timestamp.toISOString(),
    hash: block.hash,
    previousHash: block.previousHash,
    validatorName: block.validator.name,
    eventCount: block._count.events,
  }))
})
