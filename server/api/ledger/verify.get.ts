import { verifyChain } from '../../services/ledger.service'

export default defineEventHandler(async (event) => {
  await requireSession(event)

  const result = await verifyChain()

  return {
    valid: result.valid,
    checkedBlocks: result.checkedBlocks,
    firstInvalidIndex: result.firstInvalidIndex,
    detail: result.detail,
  }
})
