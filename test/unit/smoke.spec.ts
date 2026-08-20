import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

describe('test environment smoke', () => {
  it('runs in a DOM environment', () => {
    const el = document.createElement('div')
    el.textContent = 'buriram silk'
    document.body.appendChild(el)
    expect(document.body.textContent).toContain('buriram silk')
  })

  it('computes SHA-256 deterministically via node:crypto (ledger foundation)', () => {
    const sha256 = (input: string) =>
      createHash('sha256').update(input).digest('hex')

    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    expect(sha256('abc')).toBe(sha256('abc'))
    expect(sha256('abc')).not.toBe(sha256('abd'))
  })
})
