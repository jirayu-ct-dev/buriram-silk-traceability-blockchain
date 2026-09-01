/**
 * canonical-serialize.spec.ts
 *
 * Unit tests for canonicalSerialize() and sha256Hex().
 * These tests verify determinism (stability), which is critical for
 * the ledger hash chain — the same data must always produce the same hash.
 */
import { describe, expect, it } from 'vitest'
import { canonicalSerialize, sha256Hex } from '../../../shared/utils/canonical-serialize'

describe('canonicalSerialize', () => {
  describe('primitives', () => {
    it('serialises null', () => {
      expect(canonicalSerialize(null)).toBe('null')
    })

    it('serialises booleans', () => {
      expect(canonicalSerialize(true)).toBe('true')
      expect(canonicalSerialize(false)).toBe('false')
    })

    it('serialises numbers without leading zeros', () => {
      expect(canonicalSerialize(0)).toBe('0')
      expect(canonicalSerialize(42)).toBe('42')
      expect(canonicalSerialize(3.14)).toBe('3.14')
      expect(canonicalSerialize(-7)).toBe('-7')
    })

    it('serialises strings with double quotes', () => {
      expect(canonicalSerialize('hello')).toBe('"hello"')
      expect(canonicalSerialize('')).toBe('""')
      expect(canonicalSerialize('with "quotes"')).toBe('"with \\"quotes\\""')
    })
  })

  describe('objects', () => {
    it('sorts object keys alphabetically', () => {
      const obj = { z: 1, a: 2, m: 3 }
      expect(canonicalSerialize(obj)).toBe('{"a":2,"m":3,"z":1}')
    })

    it('is deterministic regardless of insertion order', () => {
      const obj1 = { b: 2, a: 1 }
      const obj2 = { a: 1, b: 2 }
      expect(canonicalSerialize(obj1)).toBe(canonicalSerialize(obj2))
    })

    it('produces no whitespace', () => {
      const result = canonicalSerialize({ key: 'value', num: 42 })
      expect(result).not.toMatch(/\s/)
    })

    it('handles nested objects with sorted keys', () => {
      const obj = { z: { b: 2, a: 1 }, a: { y: 3, x: 4 } }
      expect(canonicalSerialize(obj)).toBe('{"a":{"x":4,"y":3},"z":{"a":1,"b":2}}')
    })

    it('handles empty object', () => {
      expect(canonicalSerialize({})).toBe('{}')
    })
  })

  describe('arrays', () => {
    it('preserves array insertion order', () => {
      expect(canonicalSerialize([3, 1, 2])).toBe('[3,1,2]')
    })

    it('handles nested arrays', () => {
      expect(canonicalSerialize([[1, 2], [3, 4]])).toBe('[[1,2],[3,4]]')
    })

    it('handles arrays of objects', () => {
      const arr = [{ b: 2, a: 1 }, { d: 4, c: 3 }]
      expect(canonicalSerialize(arr)).toBe('[{"a":1,"b":2},{"c":3,"d":4}]')
    })
  })

  describe('determinism (stability)', () => {
    it('produces the same string for identical objects regardless of key order', () => {
      const a = { x: 1, y: 2, z: 3 }
      const b = { z: 3, x: 1, y: 2 }
      const c = { y: 2, z: 3, x: 1 }
      expect(canonicalSerialize(a)).toBe(canonicalSerialize(b))
      expect(canonicalSerialize(b)).toBe(canonicalSerialize(c))
    })

    it('produces different strings for different values', () => {
      expect(canonicalSerialize({ a: 1 })).not.toBe(canonicalSerialize({ a: 2 }))
    })
  })
})

describe('sha256Hex', () => {
  it('computes correct SHA-256 for known input "abc"', () => {
    // Golden value from NIST test vector
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('is deterministic', () => {
    const input = 'buriram silk traceability'
    expect(sha256Hex(input)).toBe(sha256Hex(input))
  })

  it('produces different hashes for different inputs', () => {
    expect(sha256Hex('abc')).not.toBe(sha256Hex('abd'))
  })

  it('returns lowercase hex string of length 64', () => {
    const result = sha256Hex('test')
    expect(result).toHaveLength(64)
    expect(result).toMatch(/^[0-9a-f]{64}$/)
  })

  it('computes stable hash for canonicalSerialize({a:1,b:2})', () => {
    // Hardcoded golden value — computed from canonicalSerialize + sha256Hex
    // canonicalSerialize({a:1,b:2}) = '{"a":1,"b":2}'
    const input = canonicalSerialize({ a: 1, b: 2 })
    expect(input).toBe('{"a":1,"b":2}')
    const hash = sha256Hex(input)
    // Verify it equals the hardcoded expected value
    expect(hash).toBe(sha256Hex('{"a":1,"b":2}'))
    // And doesn't change — lock this value:
    expect(hash).toBe('43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777')
  })
})
