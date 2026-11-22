import { describe, expect, it } from 'vitest'

import { type Either, left, right } from './either'

function divide(dividend: number, divisor: number): Either<string, number> {
  return divisor === 0 ? left('division by zero') : right(dividend / divisor)
}

describe('Either', () => {
  it('carries the value on the right side', () => {
    const result = divide(10, 2)

    expect(result.isRight()).toBe(true)
    expect(result.isLeft()).toBe(false)
    expect(result.value).toBe(5)
  })

  it('carries the error on the left side', () => {
    const result = divide(10, 0)

    expect(result.isLeft()).toBe(true)
    expect(result.isRight()).toBe(false)
    expect(result.value).toBe('division by zero')
  })

  it('narrows the value type after the check', () => {
    const result = divide(9, 3)

    if (result.isLeft()) throw new Error('expected a right')

    const value: number = result.value
    expect(value).toBe(3)
  })
})
