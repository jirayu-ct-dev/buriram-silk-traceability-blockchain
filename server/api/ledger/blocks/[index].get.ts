/**
 * GET /api/ledger/blocks/:index
 *
 * Returns LedgerBlockDetail for a specific block index.
 * Computes signatureValid on the fly using the stored public key.
 * Returns 404 if the block does not exist.
 *
 * Payload is shown here because by design it contains no PII —
 * only IDs, codes, hashes, and numbers. See Contract A.
 */
import { verify as cryptoVerify } from 'node:crypto'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  const indexParam = getRouterParam(event, 'index')
  const blockIndex = Number(indexParam)

  if (!Number.isInteger(blockIndex) || blockIndex < 0 || Number.isNaN(blockIndex)) {
    throw createError({ statusCode: 400, message: 'พารามิเตอร์ index ต้องเป็นจำนวนเต็มที่ไม่ติดลบ' })
  }

  const block = await prisma.ledgerBlock.findUnique({
    where: { index: blockIndex },
    include: {
      validator: { select: { name: true, publicKey: true } },
      events: {
        select: {
          eventType: true,
          aggregateId: true,
          payload: true,
        },
      },
    },
  })

  if (!block) {
    throw createError({ statusCode: 404, message: `ไม่พบบล็อกที่ index ${blockIndex}` })
  }

  // Verify signature live
  let signatureValid: boolean
  try {
    const data = Buffer.from(block.hash, 'utf8')
    const sigBuffer = Buffer.from(block.signature, 'hex')
    signatureValid = cryptoVerify(null, data, block.validator.publicKey, sigBuffer)
  }
  catch {
    signatureValid = false
  }

  return {
    index: block.index,
    timestamp: block.timestamp.toISOString(),
    hash: block.hash,
    previousHash: block.previousHash,
    validatorName: block.validator.name,
    eventCount: block.events.length,
    events: block.events.map(e => ({
      eventType: e.eventType,
      aggregateId: e.aggregateId ?? undefined,
      payload: e.payload as Record<string, unknown>,
    })),
    signatureValid,
  }
})
