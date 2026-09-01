/**
 * GET /api/ledger/verify
 *
 * Runs verifyChain() against the entire ledger and returns VerifyResult
 * with an additional verifiedAt timestamp (ISO 8601 UTC).
 *
 * Public endpoint — no authentication required.
 */
import { prisma } from '../../utils/db'
import { verifyChain } from '../../services/ledger.service'

export default defineEventHandler(async (_event) => {
  const result = await verifyChain(prisma)

  return {
    ...result,
    verifiedAt: new Date().toISOString(),
  }
})
