import { formatCompactMoney, formatCompactNumber, formatMoney, formatNumber, formatPercent } from '@workspace/utils'

/**
 * How a chart writes its values. A name for the usual ones, or a function for anything else.
 *
 * - `money`: the value is an integer number of cents, as the API sends it (`formatMoney`);
 * - `compactMoney`: the same, short (`$12.5K`), the default of the axes of a `money` chart;
 * - `percent`: a share of 100 (`42%`);
 * - `number`, `compactNumber`.
 */
export type ValueFormat =
  'money' | 'compactMoney' | 'percent' | 'number' | 'compactNumber' | ((value: number) => string)

const NAMED: Record<Exclude<ValueFormat, (value: number) => string>, (value: number) => string> = {
  money: (value) => formatMoney(value),
  compactMoney: (value) => formatCompactMoney(value),
  percent: (value) => formatPercent(value),
  number: (value) => formatNumber(value),
  compactNumber: (value) => formatCompactNumber(value),
}

/** The formatter of a format. Default: plain numbers. */
export const formatterOf = (format: ValueFormat = 'number'): ((value: number) => string) =>
  typeof format === 'function' ? format : NAMED[format]

/** The formatter for an axis: the short form of the same thing (an axis has no room for `$12,345.67`). */
export const axisFormatterOf = (format: ValueFormat = 'number'): ((value: number) => string) => {
  if (format === 'money') return NAMED.compactMoney
  if (format === 'number') return NAMED.compactNumber

  return formatterOf(format)
}

/** Recharts hands values over as `unknown`: a number when it is one, `0` otherwise. */
export const toNumber = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
