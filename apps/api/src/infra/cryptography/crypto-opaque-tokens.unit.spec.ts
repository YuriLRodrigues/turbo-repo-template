import { describe, expect, it } from 'vitest'

import { CryptoOpaqueTokens } from './crypto-opaque-tokens'

describe('CryptoOpaqueTokens', () => {
  const tokens = new CryptoOpaqueTokens()

  it('issues a URL-safe token and the SHA-256 that is stored in its place', () => {
    const { token, hash } = tokens.issue()

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(tokens.hash(token))
    expect(hash).not.toContain(token)
  })

  it('never issues the same token twice', () => {
    const issued = new Set(Array.from({ length: 200 }, () => tokens.issue().token))

    expect(issued.size).toBe(200)
  })

  it('hashes deterministically', () => {
    expect(tokens.hash('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
