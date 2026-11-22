import { describe, expect, it } from 'vitest'

import { InvalidEmailError } from '../../errors/invalid-email.error'
import { Email } from './email'

describe('Email', () => {
  it('trims and lower-cases the address', () => {
    const result = Email.create('  Jane.Doe@Example.COM ')

    expect(result.isRight()).toBe(true)
    expect(result.value).toBeInstanceOf(Email)
    expect((result.value as Email).value).toBe('jane.doe@example.com')
  })

  it.each(['', 'jane', 'jane@', '@example.com', 'jane@example', 'jane doe@example.com'])('rejects "%s"', (raw) => {
    const result = Email.create(raw)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidEmailError)
  })

  it('rejects an address longer than 254 characters', () => {
    expect(Email.create(`${'a'.repeat(250)}@example.com`).isLeft()).toBe(true)
  })

  it('is equal to another e-mail with the same address', () => {
    expect(Email.restore('jane@example.com').equals(Email.restore('jane@example.com'))).toBe(true)
    expect(Email.restore('jane@example.com').equals(Email.restore('john@example.com'))).toBe(false)
  })
})
