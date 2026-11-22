import { describe, expect, it } from 'vitest'

import { isAcceptablePassword } from './password.policy'

describe('isAcceptablePassword (rule 1.1)', () => {
  it('asks for 8 characters or more', () => {
    expect(isAcceptablePassword('1234567')).toBe(false)
    expect(isAcceptablePassword('12345678')).toBe(true)
    expect(isAcceptablePassword('a much longer passphrase')).toBe(true)
  })

  it('counts characters, not bytes', () => {
    expect(isAcceptablePassword('ação1234')).toBe(true)
    expect(isAcceptablePassword('ação123')).toBe(false)
  })
})
