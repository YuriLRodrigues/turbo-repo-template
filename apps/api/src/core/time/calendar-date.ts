/**
 * Rule 0.2: the day something happened or is due is a date without a time. It travels as `YYYY-MM-DD` in every
 * layer (JSON, domain, the `date` columns), so it never shifts with a time zone and compares as plain text.
 */
export type CalendarDate = string

/** A calendar month, `YYYY-MM`. */
export type YearMonth = string

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/

/** Outside this range a date is a typing mistake, and JavaScript reads years below 100 as 19xx. */
export const MIN_YEAR = 1900
export const MAX_YEAR = 2999

const DAY_MS = 86_400_000

export type DateParts = { year: number; month: number; day: number }

const pad = (value: number, length = 2): string => String(value).padStart(length, '0')

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** True for a real day of the calendar: `2026-02-30` is not one. */
export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== 'string') return false
  const match = DATE_PATTERN.exec(value)
  if (!match) return false

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]

  return (
    year >= MIN_YEAR && year <= MAX_YEAR && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)
  )
}

export function isYearMonth(value: unknown): value is YearMonth {
  if (typeof value !== 'string') return false
  const match = MONTH_PATTERN.exec(value)
  if (!match) return false

  const [year, month] = [Number(match[1]), Number(match[2])]

  return year >= MIN_YEAR && year <= MAX_YEAR && month >= 1 && month <= 12
}

export function partsOf(date: CalendarDate): DateParts {
  return { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)), day: Number(date.slice(8, 10)) }
}

/** Rule 0.3: a day that does not exist in the month (31 in February) falls on the last day of that month. */
export function dateInMonth(year: number, month: number, day: number): CalendarDate {
  return `${pad(year, 4)}-${pad(month)}-${pad(Math.min(day, daysInMonth(year, month)))}`
}

const toEpochDay = (date: CalendarDate): number => {
  const { year, month, day } = partsOf(date)

  return Date.UTC(year, month - 1, day) / DAY_MS
}

const fromEpochDay = (epochDay: number): CalendarDate => {
  const date = new Date(epochDay * DAY_MS)

  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromEpochDay(toEpochDay(date) + days)
}

/** Whole days from `from` to `to`: positive when `to` is later. */
export function daysBetween(from: CalendarDate, to: CalendarDate): number {
  return toEpochDay(to) - toEpochDay(from)
}

/**
 * The same day `months` months away (rule 0.3). `anchorDay` is the day that is being repeated: an instalment bought
 * on the 31st falls on February 28th and then on March 31st again, so pass the original day, not the clamped one.
 */
export function addMonths(date: CalendarDate, months: number, anchorDay: number = partsOf(date).day): CalendarDate {
  const { year, month } = partsOf(date)
  const index = year * 12 + (month - 1) + months

  return dateInMonth(Math.floor(index / 12), (index % 12) + 1, anchorDay)
}

export function monthOf(date: CalendarDate): YearMonth {
  return date.slice(0, 7)
}

export function firstDayOfMonth(month: YearMonth): CalendarDate {
  return `${month}-01`
}

export function lastDayOfMonth(month: YearMonth): CalendarDate {
  const year = Number(month.slice(0, 4))
  const monthNumber = Number(month.slice(5, 7))

  return `${month}-${pad(daysInMonth(year, monthNumber))}`
}

/** The earlier of two dates. Dates in this format order as text. */
export function earliestDate(a: CalendarDate, b: CalendarDate): CalendarDate {
  return a <= b ? a : b
}
