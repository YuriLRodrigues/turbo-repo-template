import { describe, expect, it } from 'vitest'

import { allocateByWeights, splitEvenly } from './largest-remainder'
import { isAmountCents, isSignedAmountCents, MAX_AMOUNT_CENTS } from './money'

describe('isAmountCents (rule 0.1)', () => {
  it('accepts a positive integer up to 1,000,000,000.00', () => {
    expect(isAmountCents(1)).toBe(true)
    expect(isAmountCents(MAX_AMOUNT_CENTS)).toBe(true)
  })

  it.each([0, -1, 10.5, MAX_AMOUNT_CENTS + 1, Number.NaN, Number.POSITIVE_INFINITY, '100', null, undefined])(
    'rejects %s',
    (value) => {
      expect(isAmountCents(value)).toBe(false)
    },
  )
})

describe('isSignedAmountCents (rule 0.1)', () => {
  it('accepts zero and both directions within the cap', () => {
    expect(isSignedAmountCents(0)).toBe(true)
    expect(isSignedAmountCents(-MAX_AMOUNT_CENTS)).toBe(true)
    expect(isSignedAmountCents(MAX_AMOUNT_CENTS)).toBe(true)
  })

  it.each([0.5, MAX_AMOUNT_CENTS + 1, -MAX_AMOUNT_CENTS - 1, Number.NaN, '0'])('rejects %s', (value) => {
    expect(isSignedAmountCents(value)).toBe(false)
  })
})

describe('splitEvenly (rule 0.1)', () => {
  it('gives the cents left over to the first parts', () => {
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333])
    expect(splitEvenly(100, 6)).toEqual([17, 17, 17, 17, 16, 16])
  })

  it('divides exactly when it can', () => {
    expect(splitEvenly(1200, 4)).toEqual([300, 300, 300, 300])
  })

  it('always adds up to the total', () => {
    for (const total of [1, 7, 99, 100, 12_345, 999_999, MAX_AMOUNT_CENTS]) {
      for (const parts of [1, 2, 3, 7, 12, 48]) {
        const split = splitEvenly(total, parts)

        expect(split).toHaveLength(parts)
        expect(split.reduce((sum, part) => sum + part, 0)).toBe(total)
        expect(Math.max(...split) - Math.min(...split)).toBeLessThanOrEqual(1)
      }
    }
  })

  it('hands out zeros when there are more parts than cents', () => {
    expect(splitEvenly(2, 5)).toEqual([1, 1, 0, 0, 0])
    expect(splitEvenly(0, 3)).toEqual([0, 0, 0])
  })

  it('refuses a number of parts that is not a positive integer', () => {
    expect(() => splitEvenly(100, 0)).toThrow(RangeError)
    expect(() => splitEvenly(100, 2.5)).toThrow(RangeError)
  })
})

describe('allocateByWeights (rule 0.1)', () => {
  it('follows the weights', () => {
    expect(allocateByWeights(1000, [50, 30, 20])).toEqual([500, 300, 200])
  })

  it('gives the cent left over to the largest remainder', () => {
    // Exact shares: 33.33, 66.67 -> the second part has the largest remainder.
    expect(allocateByWeights(100, [1, 2])).toEqual([33, 67])
    // Exact shares: 16.67, 33.33, 50 -> the first part has the largest remainder.
    expect(allocateByWeights(100, [1, 2, 3])).toEqual([17, 33, 50])
  })

  it('breaks a tie of remainders in favour of the first parts', () => {
    expect(allocateByWeights(101, [1, 1])).toEqual([51, 50])
    expect(allocateByWeights(5, [1, 1, 1, 1])).toEqual([2, 1, 1, 1])
  })

  it('gives nothing to a weight of zero', () => {
    expect(allocateByWeights(100, [0, 1, 0])).toEqual([0, 100, 0])
  })

  it('stays exact at the cap of an amount', () => {
    const parts = allocateByWeights(MAX_AMOUNT_CENTS, [MAX_AMOUNT_CENTS, MAX_AMOUNT_CENTS, 1])

    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(MAX_AMOUNT_CENTS)
    expect(parts).toEqual([50_000_000_000, 50_000_000_000, 0])
  })

  it('refuses totals and weights that are not non-negative integers, and weights that add up to zero', () => {
    expect(() => allocateByWeights(-1, [1])).toThrow(RangeError)
    expect(() => allocateByWeights(10.5, [1])).toThrow(RangeError)
    expect(() => allocateByWeights(100, [])).toThrow(RangeError)
    expect(() => allocateByWeights(100, [1, -1])).toThrow(RangeError)
    expect(() => allocateByWeights(100, [0, 0])).toThrow(RangeError)
  })
})
