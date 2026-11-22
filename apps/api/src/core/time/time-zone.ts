import type { CalendarDate } from './calendar-date'

/** Rule 0.2: "today" and the limits of a month are computed in the user's time zone; this is the default one. */
export const DEFAULT_TIME_ZONE = 'UTC'

/** `Europe/Lisbon`, `Etc/GMT+3`, `UTC`: an IANA name, never a raw offset such as `+03:00`. */
const IANA_NAME = /^[A-Za-z][A-Za-z0-9_+-]*(\/[A-Za-z0-9_+-]+)*$/
const MAX_LENGTH = 64

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
    formatters.set(timeZone, formatter)
  }

  return formatter
}

/** True when the runtime knows the zone (the IANA database that ships with Node). */
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > MAX_LENGTH || !IANA_NAME.test(value)) return false

  try {
    formatterFor(value)

    return true
  } catch {
    return false
  }
}

/** The calendar date it is in `timeZone` at `instant`: 01:30 UTC on the 15th is still the 14th in New York. */
export function calendarDateIn(timeZone: string, instant: Date): CalendarDate {
  const parts = formatterFor(timeZone).formatToParts(instant)
  const read = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? ''

  return `${read('year').padStart(4, '0')}-${read('month')}-${read('day')}`
}
