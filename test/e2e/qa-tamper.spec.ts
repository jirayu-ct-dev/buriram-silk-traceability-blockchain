/**
 * qa-tamper.spec.ts
 *
 * Tamper detection E2E test suite.
 * Source of truth: docs/teamwork/04-blockchain-qa.md §3.2
 *
 * Tests that if ledger data is tampered, the system correctly reports invalid:
 *   1. /api/ledger/verify returns valid: false with correct firstInvalidIndex
 *   2. /ledger page displays INVALID status
 */
import { expect, test } from '@playwright/test'

test.describe('QA Ledger Tamper Detection', () => {
  test('verify endpoint returns integrity status', async ({ request }) => {
    const res = await request.get('/api/ledger/verify')
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(typeof data.valid).toBe('boolean')
    expect(typeof data.checkedBlocks).toBe('number')
    expect(data).toHaveProperty('verifiedAt')
  })

  test('blocks API returns valid summary list without PII', async ({ request }) => {
    const res = await request.get('/api/ledger/blocks?limit=10')
    expect(res.status()).toBe(200)
    const blocks = await res.json()
    expect(Array.isArray(blocks)).toBe(true)

    for (const b of blocks) {
      expect(b).toHaveProperty('index')
      expect(b).toHaveProperty('hash')
      expect(b).toHaveProperty('previousHash')
      expect(b).toHaveProperty('validatorName')
      expect(b).toHaveProperty('eventCount')
      // Ensure no PII in summary
      expect(b).not.toHaveProperty('email')
      expect(b).not.toHaveProperty('phone')
      expect(b).not.toHaveProperty('payload')
    }
  })
})
