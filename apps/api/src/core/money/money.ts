/**
 * Rule 0.1: money is always an integer number of cents, never a number with a decimal point.
 * The cap of a single value is 1,000,000,000.00 in the currency of the amount.
 */
export const MAX_AMOUNT_CENTS = 100_000_000_000

/** A positive amount within the cap: what a price, a limit or a total can be. */
export function isAmountCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= MAX_AMOUNT_CENTS
}

/** A balance: an integer within the cap in either direction (a balance can be below zero). */
export function isSignedAmountCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && Math.abs(value) <= MAX_AMOUNT_CENTS
}
