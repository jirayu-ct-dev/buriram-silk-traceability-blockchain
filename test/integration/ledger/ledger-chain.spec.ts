/**
 * ledger-chain.spec.ts
 *
 * Integration tests for the ledger service against a real PostgreSQL database.
 *
 * Prerequisites:
 *   - PostgreSQL running at DATABASE_URL (see .env)
 *   - `pnpm db:migrate` has been run
 *   - Run with: pnpm test (vitest includes integration/)
 *
 * Each test cleans up its own ledger data using a dedicated test transaction
 * that is rolled back, OR by using unique identifiers to isolate state.
 *
 * NOTE: These tests require a real DB connection. They are skipped automatically
 * if DATABASE_URL is not set, to allow CI to run unit tests without a DB.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

// Guard: skip integration tests if no DB is configured
const DATABASE_URL = process.env.DATABASE_URL
const skipIntegration = !DATABASE_URL

// Dynamic imports to avoid loading prisma when DB is not available
let prisma: import('../../../app/generated/prisma/client').PrismaClient
let ledgerService: typeof import('../../../server/services/ledger.service')

beforeAll(async () => {
  if (skipIntegration) return

  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { PrismaClient } = await import('../../../app/generated/prisma/client')
  const adapter = new PrismaPg({ connectionString: DATABASE_URL! })
  prisma = new PrismaClient({ adapter })

  ledgerService = await import('../../../server/services/ledger.service')
})

afterAll(async () => {
  if (skipIntegration || !prisma) return
  await prisma.$disconnect()
})

/**
 * Clean ledger tables in correct FK order.
 * Only call inside tests — this is destructive.
 */
async function cleanLedger() {
  await prisma.ledgerEvent.deleteMany({})
  await prisma.ledgerBlock.deleteMany({})
  await prisma.ledgerValidator.deleteMany({})
  // Remove generated key files for test validators
  const { rmSync, existsSync } = await import('node:fs')
  const { join } = await import('node:path')
  const keyDir = join(process.cwd(), 'storage', 'validator-keys')
  for (const validatorId of ['cooperative-authority-v1', 'local-certifier-authority-v1', 'retail-network-authority-v1']) {
    const keyPath = join(keyDir, `${validatorId}.pem`)
    if (existsSync(keyPath)) {
      rmSync(keyPath)
    }
  }
}

describe.skipIf(skipIntegration)('ledger integration (real DB)', () => {
  beforeEach(async () => {
    await cleanLedger()
  })

  // ---------------------------------------------------------------------------
  // Test 1: Seed → Append → Verify
  // ---------------------------------------------------------------------------
  it('seedLedger creates validators and genesis block, appendEvents adds blocks, verifyChain passes', async () => {
    await prisma.$transaction(async (tx) => {
      await ledgerService.seedLedger(tx)
    })

    // Verify genesis block exists
    const genesisBlock = await prisma.ledgerBlock.findUnique({ where: { index: 0 } })
    expect(genesisBlock).not.toBeNull()
    expect(genesisBlock?.index).toBe(0)
    expect(genesisBlock?.previousHash).toBe('0'.repeat(64))

    // Verify 3 validators created
    const validators = await prisma.ledgerValidator.count()
    expect(validators).toBe(3)

    // Verify genesis event created
    const genesisEvent = await prisma.ledgerEvent.findFirst({
      where: { eventType: 'GENESIS' },
    })
    expect(genesisEvent).not.toBeNull()

    // Append multiple event rounds
    await prisma.$transaction(async (tx) => {
      await ledgerService.appendEvents(tx, [
        {
          eventType: 'ISSUE_CERTIFICATE',
          aggregateId: 'silk-public-001',
          actorId: 'officer-uuid-001',
          payload: { certCode: 'CERT-001', silkItemId: 'silk-001' },
        },
      ])
    })

    await prisma.$transaction(async (tx) => {
      await ledgerService.appendEvents(tx, [
        {
          eventType: 'TRANSFER_ACCEPTED',
          aggregateId: 'silk-public-001',
          actorId: 'store-uuid-001',
          payload: { transferId: 'xfer-001' },
        },
        {
          eventType: 'CERTIFICATE_SUSPENDED',
          aggregateId: 'silk-public-001',
          actorId: 'officer-uuid-001',
          payload: { reason: 'pending-review' },
        },
      ])
    })

    // Should have 3 blocks total (genesis + 2 appended)
    const blockCount = await prisma.ledgerBlock.count()
    expect(blockCount).toBe(3)

    // Verify chain
    const result = await ledgerService.verifyChain(prisma)
    expect(result.valid).toBe(true)
    expect(result.checkedBlocks).toBe(3)
    expect(result.firstInvalidIndex).toBeNull()
  }, 30000)

  // ---------------------------------------------------------------------------
  // Test 2: seedLedger is idempotent
  // ---------------------------------------------------------------------------
  it('seedLedger is idempotent — calling twice does not throw or duplicate data', async () => {
    await prisma.$transaction(async (tx) => {
      await ledgerService.seedLedger(tx)
    })
    // Second call should be a no-op
    await prisma.$transaction(async (tx) => {
      await ledgerService.seedLedger(tx)
    })

    const validatorCount = await prisma.ledgerValidator.count()
    expect(validatorCount).toBe(3) // exactly 3, not 6

    const blockCount = await prisma.ledgerBlock.count()
    expect(blockCount).toBe(1) // exactly 1 genesis block
  }, 30000)

  // ---------------------------------------------------------------------------
  // Test 3: append-only trigger — direct UPDATE of ledger_blocks must be rejected
  // ---------------------------------------------------------------------------
  it('append-only trigger: direct UPDATE on ledger_blocks is rejected by DB', async () => {
    await prisma.$transaction(async (tx) => {
      await ledgerService.seedLedger(tx)
    })

    const genesisBlock = await prisma.ledgerBlock.findUnique({ where: { index: 0 } })
    expect(genesisBlock).not.toBeNull()

    // Attempt to UPDATE via raw SQL — should throw due to append-only trigger
    await expect(
      prisma.$executeRaw`UPDATE ledger_blocks SET hash = ${'0'.repeat(64)} WHERE index = 0`,
    ).rejects.toThrow()
  }, 30000)

  // ---------------------------------------------------------------------------
  // Test 4: Transaction rollback — appendEvents failure must leave no orphan blocks
  // ---------------------------------------------------------------------------
  it('appendEvents rolls back cleanly when transaction is aborted', async () => {
    await prisma.$transaction(async (tx) => {
      await ledgerService.seedLedger(tx)
    })

    const blockCountBefore = await prisma.ledgerBlock.count()

    // Force a rollback by throwing inside the transaction after appendEvents
    await expect(
      prisma.$transaction(async (tx) => {
        await ledgerService.appendEvents(tx, [
          {
            eventType: 'ISSUE_CERTIFICATE',
            aggregateId: 'silk-rollback-test',
            actorId: 'officer-001',
            payload: { certCode: 'CERT-ROLLBACK' },
          },
        ])
        // Force rollback
        throw new Error('Intentional rollback for testing')
      }),
    ).rejects.toThrow('Intentional rollback for testing')

    // Block count should be unchanged — no orphan blocks
    const blockCountAfter = await prisma.ledgerBlock.count()
    expect(blockCountAfter).toBe(blockCountBefore)

    // Verify chain should still be valid
    const result = await ledgerService.verifyChain(prisma)
    expect(result.valid).toBe(true)
  }, 30000)

  // ---------------------------------------------------------------------------
  // Test 5: PII check — event payloads must not contain PII fields
  // ---------------------------------------------------------------------------
  it('ledger event payloads do not contain PII fields', async () => {
    await prisma.$transaction(async (tx) => {
      await ledgerService.seedLedger(tx)
    })

    await prisma.$transaction(async (tx) => {
      await ledgerService.appendEvents(tx, [
        {
          eventType: 'ISSUE_CERTIFICATE',
          aggregateId: 'silk-pii-test',
          actorId: 'officer-001',
          payload: {
            certCode: 'CERT-PII-TEST',
            silkItemPublicId: 'SILK-001',
          },
        },
      ])
    })

    const events = await prisma.ledgerEvent.findMany({
      where: { eventType: { not: 'GENESIS' } },
    })

    const PII_FIELD_NAMES = ['name', 'email', 'phone', 'address', 'fullName', 'displayName']

    for (const event of events) {
      const payload = event.payload as Record<string, unknown>
      for (const field of PII_FIELD_NAMES) {
        expect(payload).not.toHaveProperty(field)
      }
    }
  }, 30000)
})
