import { describe, expect, it } from 'vitest'

import { UniqueEntityId } from './unique-entity-id'

describe('UniqueEntityId', () => {
  it('generates a UUID when no value is given', () => {
    const id = new UniqueEntityId()

    expect(id.toString()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('keeps the given value', () => {
    expect(new UniqueEntityId('fixed-id').toValue()).toBe('fixed-id')
  })

  it('compares by value', () => {
    expect(new UniqueEntityId('a').equals(new UniqueEntityId('a'))).toBe(true)
    expect(new UniqueEntityId('a').equals(new UniqueEntityId('b'))).toBe(false)
  })
})
