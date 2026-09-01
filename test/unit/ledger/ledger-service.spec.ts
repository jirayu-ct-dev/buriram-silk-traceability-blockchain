/**
 * ledger-service.spec.ts
 *
 * Unit tests for the ledger service business logic.
 * Uses in-memory structures (no real DB) to test:
 *   - computeBlockHash determinism
 *   - computeCanonicalData ordering
 *   - verifyChain tamper detection (hash, previousHash, signature, rotation)
 *   - Round-robin validator selection (7 blocks / 3 validators)
 *
 * NOTE: Full integration tests (with real DB) are in test/integration/ledger/.
 */
import {
  sign as cryptoSign,
  verify as cryptoVerify,
  generateKeyPairSync,
} from 'node:crypto'
import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'
import { canonicalSerialize } from '../../../shared/utils/canonical-serialize'
import {
  computeBlockHash,
  computeCanonicalData,
} from '../../../server/services/ledger.service'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKeyPair() {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  })
  return { privateKey, publicKey }
}

function signHash(hash: string, privateKeyPem: string): string {
  const data = Buffer.from(hash, 'utf8')
  return cryptoSign(null, data, privateKeyPem).toString('hex')
}

interface MockValidator {
  id: string
  validatorId: string
  publicKey: string
  privateKey: string
  nonce: bigint
  createdAt: Date
}

interface MockBlock {
  id: string
  index: number
  timestamp: Date
  dataHash: string
  nonce: bigint
  previousHash: string
  hash: string
  validatorId: string // UUID
  signature: string
  events: MockEvent[]
}

interface MockEvent {
  eventType: string
  aggregateId: string | null
  actorId: string | null
  payload: Record<string, unknown>
}

const GENESIS_PREVIOUS_HASH = '0'.repeat(64)

function buildChain(
  validators: MockValidator[],
  blockCount: number,
  events: MockEvent[][] = [],
): MockBlock[] {
  const blocks: MockBlock[] = []
  // Reset nonces
  const nonceTracker = new Map<string, bigint>()

  for (let i = 0; i < blockCount; i++) {
    const validatorIndex = i % validators.length
    const validator = validators[validatorIndex]!
    const prevNonce = nonceTracker.get(validator.id) ?? 0n
    const nonce = prevNonce + 1n
    nonceTracker.set(validator.id, nonce)

    const previousHash = i === 0 ? GENESIS_PREVIOUS_HASH : blocks[i - 1]!.hash
    const blockEvents: MockEvent[] = events[i] ?? [
      {
        eventType: i === 0 ? 'GENESIS' : 'ISSUE_CERTIFICATE',
        aggregateId: i === 0 ? null : `silk-${i}`,
        actorId: i === 0 ? null : `user-${i}`,
        payload: i === 0 ? { note: 'Local Blockchain Simulation Genesis' } : { silkItemId: `item-${i}` },
      },
    ]

    const canonicalData = computeCanonicalData(blockEvents)
    const timestamp = new Date(Date.now() + i * 1000)
    const hash = computeBlockHash({
      index: i,
      timestamp,
      canonicalData,
      nonce,
      previousHash,
      validatorId: validator.validatorId,
    })
    const signature = signHash(hash, validator.privateKey)

    blocks.push({
      id: `block-${i}`,
      index: i,
      timestamp,
      dataHash: canonicalData,
      nonce,
      previousHash,
      hash,
      validatorId: validator.id,
      signature,
      events: blockEvents,
    })
  }
  return blocks
}

// ---------------------------------------------------------------------------
// In-memory verifyChain clone (mirrors real logic without I/O)
// ---------------------------------------------------------------------------
function verifyChainSync(
  blocks: MockBlock[],
  validators: MockValidator[],
): {
  valid: boolean
  checkedBlocks: number
  firstInvalidIndex: number | null
  detail?: string
} {
  if (blocks.length === 0) {
    return { valid: true, checkedBlocks: 0, firstInvalidIndex: null }
  }

  const nonceTracker = new Map<string, bigint>()
  const validatorMap = new Map(validators.map(v => [v.id, v]))
  const validatorCount = validators.length

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!

    if (block.index !== i) {
      return { valid: false, checkedBlocks: i, firstInvalidIndex: block.index, detail: `Index mismatch at position ${i}` }
    }

    const expectedPrev = i === 0 ? GENESIS_PREVIOUS_HASH : blocks[i - 1]!.hash
    if (block.previousHash !== expectedPrev) {
      return { valid: false, checkedBlocks: i, firstInvalidIndex: block.index, detail: `previousHash mismatch at block ${block.index}` }
    }

    const expectedValidatorId = validators[block.index % validatorCount]!.id
    if (block.validatorId !== expectedValidatorId) {
      return { valid: false, checkedBlocks: i, firstInvalidIndex: block.index, detail: `Wrong validator at block ${block.index}` }
    }

    const prevNonce = nonceTracker.get(block.validatorId) ?? 0n
    if (block.nonce !== prevNonce + 1n) {
      return { valid: false, checkedBlocks: i, firstInvalidIndex: block.index, detail: `Nonce mismatch at block ${block.index}` }
    }
    nonceTracker.set(block.validatorId, block.nonce)

    const validator = validatorMap.get(block.validatorId)!
    const canonicalData = computeCanonicalData(block.events)
    const recomputed = computeBlockHash({
      index: block.index,
      timestamp: block.timestamp,
      canonicalData,
      nonce: block.nonce,
      previousHash: block.previousHash,
      validatorId: validator.validatorId,
    })
    if (recomputed !== block.hash) {
      return { valid: false, checkedBlocks: i, firstInvalidIndex: block.index, detail: `Hash mismatch at block ${block.index}` }
    }

    const data = Buffer.from(block.hash, 'utf8')
    const sigBuffer = Buffer.from(block.signature, 'hex')
    const sigOk = cryptoVerify(null, data, validator.publicKey, sigBuffer)
    if (!sigOk) {
      return { valid: false, checkedBlocks: i, firstInvalidIndex: block.index, detail: `Signature invalid at block ${block.index}` }
    }
  }

  return { valid: true, checkedBlocks: blocks.length, firstInvalidIndex: null }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeCanonicalData', () => {
  it('produces deterministic output regardless of event object property order', () => {
    const events1 = [{ eventType: 'GENESIS', aggregateId: null, actorId: null, payload: { note: 'test' } }]
    const events2 = [{ actorId: null, aggregateId: null, eventType: 'GENESIS', payload: { note: 'test' } }]
    expect(computeCanonicalData(events1)).toBe(computeCanonicalData(events2))
  })

  it('matches manually constructed canonical JSON', () => {
    const events = [
      { eventType: 'ISSUE_CERTIFICATE', aggregateId: 'agg-1', actorId: 'user-1', payload: { certCode: 'CERT-001' } },
    ]
    const result = computeCanonicalData(events)
    // Keys should be alphabetically sorted
    expect(result).toContain('"aggregateId"')
    expect(result.indexOf('"actorId"')).toBeLessThan(result.indexOf('"aggregateId"'))
    expect(result.indexOf('"aggregateId"')).toBeLessThan(result.indexOf('"eventType"'))
  })

  it('uses canonicalSerialize under the hood', () => {
    const events = [{ eventType: 'GENESIS', aggregateId: null, actorId: null, payload: {} }]
    const normalized = [{ aggregateId: null, actorId: null, eventType: 'GENESIS', payload: {} }]
    expect(computeCanonicalData(events)).toBe(canonicalSerialize(normalized))
  })
})

describe('computeBlockHash', () => {
  it('is deterministic for same inputs', () => {
    const ts = new Date('2026-01-01T00:00:00.000Z')
    const params = {
      index: 0,
      timestamp: ts,
      canonicalData: '{"events":[]}',
      nonce: 1n,
      previousHash: '0'.repeat(64),
      validatorId: 'validator-1',
    }
    expect(computeBlockHash(params)).toBe(computeBlockHash(params))
  })

  it('changes when index changes', () => {
    const ts = new Date('2026-01-01T00:00:00.000Z')
    const base = { index: 0, timestamp: ts, canonicalData: 'data', nonce: 1n, previousHash: '0'.repeat(64), validatorId: 'v1' }
    expect(computeBlockHash(base)).not.toBe(computeBlockHash({ ...base, index: 1 }))
  })

  it('changes when nonce changes', () => {
    const ts = new Date('2026-01-01T00:00:00.000Z')
    const base = { index: 0, timestamp: ts, canonicalData: 'data', nonce: 1n, previousHash: '0'.repeat(64), validatorId: 'v1' }
    expect(computeBlockHash(base)).not.toBe(computeBlockHash({ ...base, nonce: 2n }))
  })

  it('changes when canonicalData changes', () => {
    const ts = new Date('2026-01-01T00:00:00.000Z')
    const base = { index: 0, timestamp: ts, canonicalData: 'data', nonce: 1n, previousHash: '0'.repeat(64), validatorId: 'v1' }
    expect(computeBlockHash(base)).not.toBe(computeBlockHash({ ...base, canonicalData: 'different' }))
  })

  it('produces a 64-character lowercase hex string', () => {
    const ts = new Date('2026-01-01T00:00:00.000Z')
    const hash = computeBlockHash({ index: 0, timestamp: ts, canonicalData: 'data', nonce: 1n, previousHash: '0'.repeat(64), validatorId: 'v1' })
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })
})

describe('verifyChain (in-memory)', () => {
  let validators: MockValidator[]

  beforeEach(() => {
    validators = [
      { id: 'v-id-1', validatorId: 'validator-1', ...makeKeyPair(), nonce: 0n, createdAt: new Date('2026-01-01') },
      { id: 'v-id-2', validatorId: 'validator-2', ...makeKeyPair(), nonce: 0n, createdAt: new Date('2026-01-02') },
      { id: 'v-id-3', validatorId: 'validator-3', ...makeKeyPair(), nonce: 0n, createdAt: new Date('2026-01-03') },
    ]
  })

  it('valid chain passes verification', () => {
    const blocks = buildChain(validators, 5)
    const result = verifyChainSync(blocks, validators)
    expect(result.valid).toBe(true)
    expect(result.checkedBlocks).toBe(5)
    expect(result.firstInvalidIndex).toBeNull()
  })

  it('Tamper 1: altering hash of a middle block is detected', () => {
    const blocks = buildChain(validators, 5)
    // Tamper: replace hash of block 2 with garbage
    blocks[2] = { ...blocks[2]!, hash: 'a'.repeat(64) }
    const result = verifyChainSync(blocks, validators)
    expect(result.valid).toBe(false)
    expect(result.firstInvalidIndex).toBe(2)
    // Either hash mismatch or previousHash mismatch at block 3
    expect(result.detail).toBeDefined()
  })

  it('Tamper 2: altering previousHash of block 3 is detected', () => {
    const blocks = buildChain(validators, 5)
    blocks[3] = { ...blocks[3]!, previousHash: 'b'.repeat(64) }
    const result = verifyChainSync(blocks, validators)
    expect(result.valid).toBe(false)
    expect(result.firstInvalidIndex).toBe(3)
    expect(result.detail).toContain('previousHash')
  })

  it('Tamper 3: altering signature of a block is detected', () => {
    const blocks = buildChain(validators, 5)
    blocks[2] = { ...blocks[2]!, signature: 'c'.repeat(128) }
    const result = verifyChainSync(blocks, validators)
    expect(result.valid).toBe(false)
    expect(result.firstInvalidIndex).toBe(2)
    expect(result.detail).toContain('ignature')
  })

  it('altering payload of an event makes hash mismatch detectable', () => {
    const blocks = buildChain(validators, 5)
    // Tamper: change event payload in block 2
    const tamperedBlock = { ...blocks[2]! }
    tamperedBlock.events = tamperedBlock.events.map(e => ({
      ...e,
      payload: { ...e.payload as object, tampered: true },
    }))
    blocks[2] = tamperedBlock
    // The hash stored in block 2 no longer matches the tampered events
    const result = verifyChainSync(blocks, validators)
    expect(result.valid).toBe(false)
    expect(result.firstInvalidIndex).toBe(2)
  })

  it('swapping two blocks breaks previousHash linkage', () => {
    const blocks = buildChain(validators, 5)
    // Swap block 1 and block 2 indices
    const temp = { ...blocks[1]! }
    blocks[1] = { ...blocks[2]!, index: 1 }
    blocks[2] = { ...temp, index: 2 }
    const result = verifyChainSync(blocks, validators)
    expect(result.valid).toBe(false)
  })

  it('wrong validator rotation is detected', () => {
    const blocks = buildChain(validators, 5)
    // Replace validator ID of block 2 with wrong one
    blocks[2] = { ...blocks[2]!, validatorId: validators[0]!.id }
    // Block 2 should be assigned validators[2 % 3] = validators[2]
    // If we put validators[0] it should fail rotation check
    const result = verifyChainSync(blocks, validators)
    expect(result.valid).toBe(false)
    // Could be rotation error or hash/sig mismatch
    expect(result.firstInvalidIndex).toBe(2)
  })

  it('round-robin: 7 blocks with 3 validators assigns correct slots', () => {
    const blocks = buildChain(validators, 7)
    // block 0 → v[0], block 1 → v[1], block 2 → v[2]
    // block 3 → v[0], block 4 → v[1], block 5 → v[2], block 6 → v[0]
    const expected = [0, 1, 2, 0, 1, 2, 0].map(i => validators[i]!.id)
    const actual = blocks.map(b => b.validatorId)
    expect(actual).toEqual(expected)

    // Count blocks per validator — validators 0 gets 3, 1 gets 2, 2 gets 2
    const counts = new Map<string, number>()
    for (const b of blocks) {
      counts.set(b.validatorId, (counts.get(b.validatorId) ?? 0) + 1)
    }
    expect(counts.get(validators[0]!.id)).toBe(3)
    expect(counts.get(validators[1]!.id)).toBe(2)
    expect(counts.get(validators[2]!.id)).toBe(2)

    // Verify chain is valid
    const result = verifyChainSync(blocks, validators)
    expect(result.valid).toBe(true)
    expect(result.checkedBlocks).toBe(7)
  })

  it('nonce increments separately per validator across round-robin', () => {
    const blocks = buildChain(validators, 7)
    // Validator 0 signs blocks 0, 3, 6 → nonces should be 1, 2, 3
    const v0Blocks = blocks.filter(b => b.validatorId === validators[0]!.id)
    expect(v0Blocks.map(b => b.nonce)).toEqual([1n, 2n, 3n])

    // Validator 1 signs blocks 1, 4 → nonces 1, 2
    const v1Blocks = blocks.filter(b => b.validatorId === validators[1]!.id)
    expect(v1Blocks.map(b => b.nonce)).toEqual([1n, 2n])
  })
})
