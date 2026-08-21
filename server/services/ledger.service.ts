import type { Prisma, PrismaClient } from '../../app/generated/prisma/client.js'

export type Tx = Prisma.TransactionClient | PrismaClient

export type LedgerEventType =
  | 'GENESIS'
  | 'ISSUE_CERTIFICATE'
  | 'TRANSFER_ACCEPTED'
  | 'CERTIFICATE_SUSPENDED'
  | 'CERTIFICATE_REACTIVATED'
  | 'CERTIFICATE_REVOKED'

export interface LedgerEventInput {
  eventType: Exclude<LedgerEventType, 'GENESIS'>
  aggregateId: string
  actorId: string
  payload: Record<string, string | number | null>
}

export interface AppendResult {
  blockIndex: number
  blockHash: string
}

export async function appendEvents(tx: Tx, events: LedgerEventInput[]): Promise<AppendResult> {
  const count = await tx.ledgerBlock.count()
  const blockIndex = count + 1
  const blockHash = 'mock_hash_' + Math.random().toString(36).substring(2, 15)

  let validator = await tx.ledgerValidator.findFirst({
    where: { isActive: true },
  })

  if (!validator) {
    validator = await tx.ledgerValidator.create({
      data: {
        validatorId: 'MOCK_VAL_1',
        name: 'Cooperative Authority Mock',
        authorityRole: 'COOPERATIVE_AUTHORITY',
        publicKey: 'mock_public_key',
        nonce: 0,
      },
    })
  }

  const lastBlock = await tx.ledgerBlock.findFirst({
    orderBy: { index: 'desc' },
  })
  const previousHash = lastBlock ? lastBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000'

  const block = await tx.ledgerBlock.create({
    data: {
      index: blockIndex,
      timestamp: new Date(),
      dataHash: 'mock_data_hash',
      nonce: BigInt(blockIndex),
      previousHash,
      hash: blockHash,
      validatorId: validator.id,
      signature: 'mock_signature',
    },
  })

  for (const event of events) {
    await tx.ledgerEvent.create({
      data: {
        eventType: event.eventType,
        blockId: block.id,
        aggregateId: event.aggregateId,
        actorId: event.actorId,
        payload: event.payload as Prisma.InputJsonValue,
      },
    })
  }

  return {
    blockIndex,
    blockHash,
  }
}

export interface VerifyResult {
  valid: boolean
  checkedBlocks: number
  firstInvalidIndex: number | null
  detail?: string
}

export async function verifyChain(): Promise<VerifyResult> {
  const count = await prisma.ledgerBlock.count()
  return {
    valid: true,
    checkedBlocks: count,
    firstInvalidIndex: null,
    detail: 'Verification successful (Mock stub)',
  }
}

export async function seedLedger(tx: Tx): Promise<void> {
  const count = await tx.ledgerBlock.count()
  if (count > 0) return

  let validator = await tx.ledgerValidator.findFirst({
    where: { validatorId: 'MOCK_VAL_1' },
  })

  if (!validator) {
    validator = await tx.ledgerValidator.create({
      data: {
        validatorId: 'MOCK_VAL_1',
        name: 'Cooperative Authority Mock',
        authorityRole: 'COOPERATIVE_AUTHORITY',
        publicKey: 'mock_public_key',
        nonce: 0,
      },
    })
  }

  await tx.ledgerBlock.create({
    data: {
      index: 0,
      timestamp: new Date(),
      dataHash: 'genesis_data_hash',
      nonce: 0n,
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      hash: 'genesis_block_hash',
      validatorId: validator.id,
      signature: 'genesis_signature',
    },
  })
}
