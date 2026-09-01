/**
 * canonical-serialize.ts
 *
 * Canonical (deterministic) JSON serialisation used by the ledger service
 * before computing SHA-256 hashes. Rules:
 *   - Object keys are sorted alphabetically (recursive)
 *   - No extra whitespace
 *   - Strings use double-quote JSON encoding
 *   - Numbers have no leading zeros (standard JSON)
 *   - null/boolean follow standard JSON rules
 *   - Arrays preserve insertion order
 *
 * Timestamp format used in ledger hash input:
 *   ISO 8601 UTC string, e.g. "2026-01-01T00:00:00.000Z"
 *   (JavaScript Date.toISOString())
 */
import { createHash } from 'node:crypto'

/**
 * Serialise any JSON-compatible value to a canonical (deterministic) string.
 *
 * @param value - The value to serialise. Must be JSON-compatible (no functions,
 *   symbols, undefined, or circular references).
 * @returns A deterministic JSON string with sorted object keys.
 */
export function canonicalSerialize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    // Primitive: number, string, boolean, null — JSON.stringify handles all cases
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    const items = value.map(item => canonicalSerialize(item))
    return '[' + items.join(',') + ']'
  }

  // Plain object — sort keys alphabetically
  const obj = value as Record<string, unknown>
  const sortedKeys = Object.keys(obj).sort()
  const pairs = sortedKeys.map(
    key => JSON.stringify(key) + ':' + canonicalSerialize(obj[key]),
  )
  return '{' + pairs.join(',') + '}'
}

/**
 * Compute the SHA-256 hex digest of a string.
 *
 * @param input - The string to hash.
 * @returns Lower-case hex string of the SHA-256 digest.
 */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}
