/**
 * Rule 0.1: every division of money (instalments, shares, averages that are shown) uses the largest remainder
 * method. The parts always add up to the total; the cents that do not divide go to the parts with the largest
 * remainder and, when remainders tie, to the first parts.
 */

function assertCents(name: string, value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer, received ${value}`)
  }
}

/**
 * Divides `totalCents` in proportion to `weights` (integers: cents, basis points, units of anything).
 * `allocateByWeights(100, [1, 1, 1])` is `[34, 33, 33]`.
 */
export function allocateByWeights(totalCents: number, weights: readonly number[]): number[] {
  assertCents('totalCents', totalCents)
  if (weights.length === 0) throw new RangeError('weights must not be empty')
  weights.forEach((weight, index) => assertCents(`weights[${index}]`, weight))

  const total = BigInt(totalCents)
  const weightSum = weights.reduce((sum, weight) => sum + BigInt(weight), 0n)
  if (weightSum === 0n) throw new RangeError('weights must not add up to zero')

  // Exact integer arithmetic: the cap of an amount times a weight does not fit in a double.
  const shares = weights.map((weight, index) => {
    const product = total * BigInt(weight)

    return { index, base: product / weightSum, remainder: product % weightSum }
  })

  const leftover = Number(total - shares.reduce((sum, share) => sum + share.base, 0n))
  const byRemainder = [...shares].sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  )
  const bumped = new Set(byRemainder.slice(0, leftover).map((share) => share.index))

  return shares.map((share) => Number(share.base) + (bumped.has(share.index) ? 1 : 0))
}

/** `parts` equal parts of `totalCents`: `splitEvenly(1000, 3)` is `[334, 333, 333]`. */
export function splitEvenly(totalCents: number, parts: number): number[] {
  if (!Number.isSafeInteger(parts) || parts < 1) {
    throw new RangeError(`parts must be a positive integer, received ${parts}`)
  }

  return allocateByWeights(
    totalCents,
    Array.from({ length: parts }, () => 1),
  )
}
