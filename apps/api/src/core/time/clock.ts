import type { CalendarDate } from './calendar-date'

/**
 * The only source of "now". Use cases ask for it instead of calling `new Date()`, so a test can fix the instant.
 * The abstract class is the DI token: infra binds `SystemClock`, tests use `FakeClock`.
 */
export abstract class Clock {
  abstract now(): Date
}

/**
 * "Today" for one person: the calendar date in the time zone of their preferences (rule 0.2). Every rule that
 * says "until today" or "this month" goes through it.
 */
export abstract class UserCalendar {
  abstract today(userId: string): Promise<CalendarDate>
}
