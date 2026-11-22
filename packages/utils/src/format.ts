/*
 * Formatting for people. Pure functions over `Intl`, the same on the server, in the browser and in tests. The API
 * sends money as an integer number of cents and days as `YYYY-MM-DD` (see apps/api, rule 0.1 and 0.2): these helpers
 * take exactly that, and nothing here does arithmetic with floats of money.
 *
 * Every function takes the locale (and, for money, the currency) explicitly, with defaults that a product changes in
 * one place: `DEFAULT_LOCALE` and `DEFAULT_CURRENCY`.
 */

export const DEFAULT_LOCALE = 'en-US'
export const DEFAULT_CURRENCY = 'USD'

type LocaleOptions = { locale?: string }
type MoneyOptions = LocaleOptions & { currency?: string }

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>()

/** `Intl` formatters are expensive to build and cheap to reuse. */
const memo = <T extends Intl.NumberFormat | Intl.DateTimeFormat | Intl.RelativeTimeFormat>(
  key: string,
  build: () => T,
): T => {
  let formatter = cache.get(key) as T | undefined
  if (!formatter) {
    formatter = build()
    cache.set(key, formatter)
  }

  return formatter
}

/** The fraction digits of a currency (2 for USD and EUR, 0 for JPY). */
const fractionDigitsOf = (currency: string, locale: string): number =>
  memo(
    `money-digits:${locale}:${currency}`,
    () => new Intl.NumberFormat(locale, { style: 'currency', currency }),
  ).resolvedOptions().maximumFractionDigits ?? 2

/** An integer number of minor units (cents) as the major unit, without floating-point surprises for display. */
const toMajor = (cents: number, digits: number): number => cents / 10 ** digits

/**
 * `formatMoney(123456)` → `$1,234.56`. `cents` is the integer number of minor units the API sends (`amountCents`).
 * A negative amount keeps its sign: `-$12.00`.
 */
export const formatMoney = (
  cents: number,
  { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY }: MoneyOptions = {},
) => {
  const digits = fractionDigitsOf(currency, locale)

  return memo(
    `money:${locale}:${currency}`,
    () => new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: digits }),
  ).format(toMajor(cents, digits))
}

/** For axes and tight spaces: `formatCompactMoney(1250000)` → `$12.5K`. */
export const formatCompactMoney = (
  cents: number,
  { locale = DEFAULT_LOCALE, currency = DEFAULT_CURRENCY }: MoneyOptions = {},
) =>
  memo(
    `money-compact:${locale}:${currency}`,
    () => new Intl.NumberFormat(locale, { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }),
  ).format(toMajor(cents, fractionDigitsOf(currency, locale)))

/** `formatNumber(12345.6)` → `12,345.6`. */
export const formatNumber = (value: number, { locale = DEFAULT_LOCALE }: LocaleOptions = {}) =>
  memo(`number:${locale}`, () => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 })).format(value)

/** `formatCompactNumber(1234567)` → `1.2M`. */
export const formatCompactNumber = (value: number, { locale = DEFAULT_LOCALE }: LocaleOptions = {}) =>
  memo(
    `number-compact:${locale}`,
    () => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }),
  ).format(value)

/** A share of 100: `formatPercent(42.4)` → `42%`; `formatPercent(4.25, { digits: 1 })` → `4.3%`. */
export const formatPercent = (
  value: number,
  { locale = DEFAULT_LOCALE, digits = 0 }: LocaleOptions & { digits?: number } = {},
) =>
  memo(
    `percent:${locale}:${digits}`,
    () => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: digits }),
  ).format(value / 100)

const CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

/** True for a real day written as `YYYY-MM-DD` (`2026-02-30` is not one). */
export const isCalendarDate = (value: string): boolean => {
  const match = CALENDAR_DATE.exec(value)
  if (!match) return false
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/**
 * A day of the API (`YYYY-MM-DD`, no time, no zone) or an instant (`Date`, ISO text with a time) for people.
 * A day is formatted in UTC on purpose: it is a date on a calendar, and the zone of the browser must not move it to
 * the day before.
 */
export const formatDate = (
  value: string | Date,
  { locale = DEFAULT_LOCALE, style = 'medium' }: LocaleOptions & { style?: 'short' | 'medium' | 'long' } = {},
) => {
  const isDay = typeof value === 'string' && CALENDAR_DATE.test(value)
  const instant = isDay ? new Date(`${value}T00:00:00Z`) : new Date(value)

  return memo(
    `date:${locale}:${style}:${isDay ? 'day' : 'instant'}`,
    () => new Intl.DateTimeFormat(locale, { dateStyle: style, ...(isDay ? { timeZone: 'UTC' } : {}) }),
  ).format(instant)
}

/** An instant with its time, in the zone of the browser: `Nov 14, 2026, 3:00 PM`. */
export const formatDateTime = (value: string | Date, { locale = DEFAULT_LOCALE }: LocaleOptions = {}) =>
  memo(`datetime:${locale}`, () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })).format(
    new Date(value),
  )

const RELATIVE_STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['second', 60],
  ['minute', 60],
  ['hour', 24],
  ['day', 7],
  ['week', 4.34524],
  ['month', 12],
  ['year', Number.POSITIVE_INFINITY],
]

/** How long ago (or how far ahead) an instant is, from `now`: `5 minutes ago`, `in 2 days`, `yesterday`. */
export const formatRelativeTime = (
  value: string | Date,
  { locale = DEFAULT_LOCALE, now = new Date() }: LocaleOptions & { now?: Date } = {},
) => {
  let amount = (new Date(value).getTime() - now.getTime()) / 1000
  const formatter = memo(`relative:${locale}`, () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }))

  for (const [unit, size] of RELATIVE_STEPS) {
    if (Math.abs(amount) < size) return formatter.format(Math.round(amount), unit)
    amount /= size
  }

  return formatter.format(Math.round(amount), 'year')
}

/** Initials for an avatar: `Jane Doe` → `JD`, `jane` → `J`. */
export const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
