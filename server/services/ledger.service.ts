/**
 * ledger.service.ts
 *
 * Local Blockchain Simulation — SHA-256 Hash Chain + Ed25519 + Proof of Authority
 *
 * CONTRACT A (docs/teamwork/00-shared-contract.md §6):
 *   - appendEvents(tx, events): Promise<AppendResult>
 *   - verifyChain():            Promise<VerifyResult>
 *   - seedLedger(tx):           Promise<void>
 *
 * Hash formula (source: prisma/schema.prisma comment):
 *   hash = SHA256(index + timestamp + canonicalData + nonce + previousHash + validatorId)
 *
 * where:
 *   index       = block index as decimal string, e.g. "0"
 *   timestamp   = ISO 8601 UTC string from Date.toISOString(), e.g. "2026-01-01T00:00:00.000Z"
 *   canonicalData = canonicalSerialize(events array) — each event: { eventType, aggregateId|null, actorId|null, payload }
 *   nonce       = validator's nonce for this block as decimal string, e.g. "1"
 *   previousHash = hex string of previous block hash (or 64 '0' chars for genesis)
 *   validatorId = LedgerValidator.validatorId (string identifier, not UUID)
 *
 * Concatenation uses "|" separator to avoid ambiguity:
 *   raw = index + "|" + timestamp + "|" + canonicalData + "|" + nonce + "|" + previousHash + "|" + validatorId
 *
 * Validator selection:
 *   Validators sorted by createdAt ASC, then round-robin by blockCount % validatorCount
 *
 * Private key storage: storage/validator-keys/<validatorId>.pem (server-only, never committed)
 */

import {
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
} from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Prisma, PrismaClient } from '../../app/generated/prisma/client'
import { canonicalSerialize, sha256Hex } from '../../shared/utils/canonical-serialize'

// ---------------------------------------------------------------------------
// Types (Contract A)
// ---------------------------------------------------------------------------

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

export interface VerifyResult {
  valid: boolean
  checkedBlocks: number
  firstInvalidIndex: number | null
  detail?: string
}

// ---------------------------------------------------------------------------
// Internal types for raw DB rows
// ---------------------------------------------------------------------------

interface RawBlockRow {
  id: string
  index: number
  timestamp: Date
  dataHash: string
  nonce: bigint
  previousHash: string
  hash: string
  validatorId: string
  signature: string
  validator: {
    id: string
    validatorId: string
    name: string
    authorityRole: string
    publicKey: string
    nonce: bigint
    isActive: boolean
    createdAt: Date
  }
  events: RawEventRow[]
}

interface RawEventRow {
  id: string
  eventType: string
  blockId: string
  aggregateId: string | null
  actorId: string | null
  payload: unknown
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Directory for Ed25519 private key PEM files (never enter DB or Git) */
function getKeyDir(): string {
  const keyDir = process.env.VALIDATOR_KEY_DIR
    ?? join(process.cwd(), 'storage', 'validator-keys')
  mkdirSync(keyDir, { recursive: true })
  return keyDir
}

function privateKeyPath(validatorId: string): string {
  return join(getKeyDir(), `${validatorId}.pem`)
}

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

export interface ValidatorKeyPair {
  validatorId: string
  privateKeyPem: string
  publicKeyPem: string
}

/**
 * Generate an Ed25519 key pair for a validator.
 * Writes the private key to storage/validator-keys/<validatorId>.pem
 * Returns the public key PEM for storage in DB.
 */
export function generateValidatorKeyPair(validatorId: string): ValidatorKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  })
  const keyDir = getKeyDir()
  mkdirSync(keyDir, { recursive: true })
  writeFileSync(privateKeyPath(validatorId), privateKey, { encoding: 'utf8', mode: 0o600 })
  return { validatorId, privateKeyPem: privateKey, publicKeyPem: publicKey }
}

function readPrivateKey(validatorId: string): string {
  return readFileSync(privateKeyPath(validatorId), 'utf8')
}

// ---------------------------------------------------------------------------
// Hash computation
// ---------------------------------------------------------------------------

/**
 * Compute the canonical data hash for a set of events in a block.
 * Each event is represented as a plain object with sorted keys
 * to ensure determinism.
 */
export function computeCanonicalData(
  events: Array<{
    eventType: string
    aggregateId: string | null
    actorId: string | null
    payload: unknown
  }>,
): string {
  const normalized = events.map(e => ({
    aggregateId: e.aggregateId,
    actorId: e.actorId,
    eventType: e.eventType,
    payload: e.payload,
  }))
  return canonicalSerialize(normalized)
}

/**
 * Compute the block hash.
 *
 * raw = index | timestamp | canonicalData | nonce | previousHash | validatorId
 * hash = SHA256(raw)
 */
export function computeBlockHash(params: {
  index: number
  timestamp: Date
  canonicalData: string
  nonce: bigint
  previousHash: string
  validatorId: string
}): string {
  const raw = [
    String(params.index),
    params.timestamp.toISOString(),
    params.canonicalData,
    String(params.nonce),
    params.previousHash,
    params.validatorId,
  ].join('|')
  return sha256Hex(raw)
}

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

/**
 * Ed25519 signing: the algorithm does not use a separate digest;
 * use crypto.sign(null, data, key) — null means no outer hash wrapper.
 */
function signHash(hash: string, privateKeyPem: string): string {
  const data = Buffer.from(hash, 'utf8')
  const signature = cryptoSign(null, data, privateKeyPem)
  return signature.toString('hex')
}

function verifySignature(hash: string, signature: string, publicKeyPem: string): boolean {
  try {
    const data = Buffer.from(hash, 'utf8')
    const sigBuffer = Buffer.from(signature, 'hex')
    return cryptoVerify(null, data, publicKeyPem, sigBuffer)
  }
  catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Genesis block
// ---------------------------------------------------------------------------

const GENESIS_PREVIOUS_HASH = '0'.repeat(64)

// ---------------------------------------------------------------------------
// seedLedger
// ---------------------------------------------------------------------------

/**
 * Create 3 validator authorities and the Genesis block (block 0).
 * Idempotent: safe to call multiple times; skips if data already exists.
 */
export async function seedLedger(tx: Tx): Promise<void> {
  // Check if already seeded
  const existingCount = await (tx as PrismaClient).ledgerValidator.count()
  if (existingCount > 0) {
    return // idempotent — skip
  }

  // Create validator key pairs
  const validatorDefs = [
    {
      validatorId: 'cooperative-authority-v1',
      name: 'สหกรณ์ผ้าไหมบุรีรัมย์ (Cooperative Authority)',
      authorityRole: 'COOPERATIVE_AUTHORITY' as const,
    },
    {
      validatorId: 'local-certifier-authority-v1',
      name: 'ผู้ตรวจรับท้องถิ่น (Local Certifier Authority)',
      authorityRole: 'LOCAL_CERTIFIER_AUTHORITY' as const,
    },
    {
      validatorId: 'retail-network-authority-v1',
      name: 'ตัวแทนร้านค้า (Retail Network Authority)',
      authorityRole: 'RETAIL_NETWORK_AUTHORITY' as const,
    },
  ]

  const createdValidators: Array<{ id: string, validatorId: string }> = []

  for (const def of validatorDefs) {
    const keyPair = generateValidatorKeyPair(def.validatorId)
    const validator = await (tx as PrismaClient).ledgerValidator.create({
      data: {
        validatorId: def.validatorId,
        name: def.name,
        authorityRole: def.authorityRole,
        publicKey: keyPair.publicKeyPem,
        nonce: BigInt(0),
        isActive: true,
      },
    })
    createdValidators.push({ id: validator.id, validatorId: validator.validatorId })
  }

  // Create Genesis block using the first validator
  const firstValidator = createdValidators[0]!
  const genesisTimestamp = new Date()
  const genesisEvents = [
    {
      eventType: 'GENESIS' as const,
      aggregateId: null,
      actorId: null,
      payload: { note: 'Local Blockchain Simulation Genesis' } as Record<string, string | number | null>,
    },
  ]
  const canonicalData = computeCanonicalData(genesisEvents)
  const genesisNonce = BigInt(1)

  const genesisHash = computeBlockHash({
    index: 0,
    timestamp: genesisTimestamp,
    canonicalData,
    nonce: genesisNonce,
    previousHash: GENESIS_PREVIOUS_HASH,
    validatorId: validatorDefs[0]!.validatorId,
  })

  const privateKey = readPrivateKey(firstValidator.validatorId)
  const signature = signHash(genesisHash, privateKey)

  // Update first validator's nonce to 1
  await (tx as PrismaClient).ledgerValidator.update({
    where: { id: firstValidator.id },
    data: { nonce: genesisNonce },
  })

  const genesisBlock = await (tx as PrismaClient).ledgerBlock.create({
    data: {
      index: 0,
      timestamp: genesisTimestamp,
      dataHash: sha256Hex(canonicalData),
      nonce: genesisNonce,
      previousHash: GENESIS_PREVIOUS_HASH,
      hash: genesisHash,
      validatorId: firstValidator.id,
      signature,
    },
  })

  // Create genesis event
  await (tx as PrismaClient).ledgerEvent.create({
    data: {
      eventType: 'GENESIS',
      blockId: genesisBlock.id,
      aggregateId: null,
      actorId: null,
      payload: { note: 'Local Blockchain Simulation Genesis' },
    },
  })
}

// ---------------------------------------------------------------------------
// appendEvents
// ---------------------------------------------------------------------------

/**
 * Append a new block containing the given events.
 *
 * - Selects the next validator via round-robin (sorted by createdAt ASC)
 * - Computes hash and Ed25519 signature
 * - Writes ledger_blocks + ledger_events inside the provided transaction
 *
 * IMPORTANT: Do NOT create a new transaction here. Use the `tx` passed in so
 * that the ledger write is atomic with the caller's business data.
 */
export async function appendEvents(tx: Tx, events: LedgerEventInput[]): Promise<AppendResult> {
  if (events.length === 0) {
    throw new Error('appendEvents: events array must not be empty')
  }

  const client = tx as PrismaClient

  // Get the last block to determine previousHash and block count
  const lastBlock = await client.ledgerBlock.findFirst({
    orderBy: { index: 'desc' },
  })
  const previousHash = lastBlock?.hash ?? GENESIS_PREVIOUS_HASH
  const newIndex = (lastBlock?.index ?? -1) + 1

  // Get all active validators sorted by createdAt for round-robin
  const validators = await client.ledgerValidator.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })

  if (validators.length === 0) {
    throw new Error('appendEvents: no active validators found — run seedLedger first')
  }

  // Round-robin: blockCount = newIndex (number of existing blocks = newIndex since 0-indexed)
  const validatorIndex = newIndex % validators.length
  const selectedValidator = validators[validatorIndex]!

  // Compute new nonce for this validator
  const newNonce = selectedValidator.nonce + BigInt(1)

  // Build canonical data from events
  const eventsForCanonical = events.map(e => ({
    eventType: e.eventType,
    aggregateId: e.aggregateId,
    actorId: e.actorId,
    payload: e.payload,
  }))
  const canonicalData = computeCanonicalData(eventsForCanonical)

  const blockTimestamp = new Date()

  const blockHash = computeBlockHash({
    index: newIndex,
    timestamp: blockTimestamp,
    canonicalData,
    nonce: newNonce,
    previousHash,
    validatorId: selectedValidator.validatorId,
  })

  const privateKey = readPrivateKey(selectedValidator.validatorId)
  const signature = signHash(blockHash, privateKey)

  // Update validator nonce
  await client.ledgerValidator.update({
    where: { id: selectedValidator.id },
    data: { nonce: newNonce },
  })

  // Create block
  const newBlock = await client.ledgerBlock.create({
    data: {
      index: newIndex,
      timestamp: blockTimestamp,
      dataHash: sha256Hex(canonicalData),
      nonce: newNonce,
      previousHash,
      hash: blockHash,
      validatorId: selectedValidator.id,
      signature,
    },
  })

  // Create events
  await client.ledgerEvent.createMany({
    data: events.map(e => ({
      eventType: e.eventType,
      blockId: newBlock.id,
      aggregateId: e.aggregateId,
      actorId: e.actorId,
      payload: e.payload as object,
    })),
  })

  return { blockIndex: newIndex, blockHash }
}

// ---------------------------------------------------------------------------
// verifyChain
// ---------------------------------------------------------------------------

/**
 * Verify the entire ledger chain.
 *
 * Checks per block:
 *   1. Hash is correct (recomputed from stored data)
 *   2. previousHash links correctly to prior block
 *   3. Validator nonce increments correctly per validator
 *   4. Validator rotation follows round-robin rule
 *   5. Signature is valid (Ed25519 verify with public key from DB)
 */
export async function verifyChain(tx?: Tx): Promise<VerifyResult> {
  const client = (tx as PrismaClient | undefined) ?? await getDefaultClient()

  const blocks = await client.ledgerBlock.findMany({
    orderBy: { index: 'asc' },
    include: {
      validator: true,
      events: true,
    },
  }) as unknown as RawBlockRow[]

  if (blocks.length === 0) {
    return { valid: true, checkedBlocks: 0, firstInvalidIndex: null, detail: 'Chain is empty' }
  }

  // Build validator nonce tracker per validator UUID
  const validatorNonceTracker = new Map<string, bigint>()
  // Build expected round-robin state
  const validators = await client.ledgerValidator.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  })
  const validatorCount = validators.length

  // Map validatorId (UUID) -> validator record for lookup
  const validatorMap = new Map<string, (typeof validators)[number]>()
  for (const v of validators) {
    validatorMap.set(v.id, v)
  }

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!
    const expectedIndex = i

    // 1. Check index continuity
    if (block.index !== expectedIndex) {
      return {
        valid: false,
        checkedBlocks: i,
        firstInvalidIndex: block.index,
        detail: `Block at position ${i} has index ${block.index}, expected ${expectedIndex}`,
      }
    }

    // 2. Check previousHash
    const expectedPreviousHash = i === 0 ? GENESIS_PREVIOUS_HASH : blocks[i - 1]!.hash
    if (block.previousHash !== expectedPreviousHash) {
      return {
        valid: false,
        checkedBlocks: i,
        firstInvalidIndex: block.index,
        detail: `Block ${block.index}: previousHash mismatch. Expected "${expectedPreviousHash.slice(0, 8)}...", got "${block.previousHash.slice(0, 8)}..."`,
      }
    }

    // 3. Check validator rotation (round-robin)
    const expectedValidatorUuid = validators[block.index % validatorCount]?.id
    if (block.validatorId !== expectedValidatorUuid) {
      return {
        valid: false,
        checkedBlocks: i,
        firstInvalidIndex: block.index,
        detail: `Block ${block.index}: wrong validator. Expected round-robin slot ${block.index % validatorCount}, got validator UUID ${block.validatorId}`,
      }
    }

    // 4. Check nonce continuity per validator
    const prevNonce = validatorNonceTracker.get(block.validatorId) ?? BigInt(0)
    const expectedNonce = prevNonce + BigInt(1)
    if (block.nonce !== expectedNonce) {
      return {
        valid: false,
        checkedBlocks: i,
        firstInvalidIndex: block.index,
        detail: `Block ${block.index}: nonce mismatch for validator. Expected ${expectedNonce}, got ${block.nonce}`,
      }
    }
    validatorNonceTracker.set(block.validatorId, block.nonce)

    // 5. Recompute hash
    const eventsForCanonical = block.events.map((e: RawEventRow) => ({
      eventType: e.eventType,
      aggregateId: e.aggregateId,
      actorId: e.actorId,
      payload: e.payload,
    }))
    const canonicalData = computeCanonicalData(eventsForCanonical)
    const validator = validatorMap.get(block.validatorId)

    if (!validator) {
      return {
        valid: false,
        checkedBlocks: i,
        firstInvalidIndex: block.index,
        detail: `Block ${block.index}: validator UUID ${block.validatorId} not found in active validators`,
      }
    }

    const recomputedHash = computeBlockHash({
      index: block.index,
      timestamp: block.timestamp,
      canonicalData,
      nonce: block.nonce,
      previousHash: block.previousHash,
      validatorId: validator.validatorId,
    })

    if (recomputedHash !== block.hash) {
      return {
        valid: false,
        checkedBlocks: i,
        firstInvalidIndex: block.index,
        detail: `Block ${block.index}: hash mismatch. Stored hash does not match recomputed value (possible data tampering)`,
      }
    }

    // 6. Verify signature
    const signatureOk = verifySignature(block.hash, block.signature, validator.publicKey)
    if (!signatureOk) {
      return {
        valid: false,
        checkedBlocks: i,
        firstInvalidIndex: block.index,
        detail: `Block ${block.index}: Ed25519 signature verification failed for validator "${validator.validatorId}"`,
      }
    }
  }

  return {
    valid: true,
    checkedBlocks: blocks.length,
    firstInvalidIndex: null,
    detail: `All ${blocks.length} block(s) verified successfully`,
  }
}

// ---------------------------------------------------------------------------
// Default client for standalone scripts (ledger:verify)
// ---------------------------------------------------------------------------

let _defaultClient: PrismaClient | undefined

async function getDefaultClient(): Promise<PrismaClient> {
  if (_defaultClient) return _defaultClient
  const { PrismaPg } = await import('@prisma/adapter-pg')
  const { PrismaClient: PC } = await import('../../app/generated/prisma/client')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  _defaultClient = new PC({ adapter })
  return _defaultClient
}
