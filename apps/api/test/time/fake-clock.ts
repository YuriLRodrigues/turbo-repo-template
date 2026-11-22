import type { CalendarDate } from '@core/time/calendar-date'
import type { Clock, UserCalendar } from '@core/time/clock'
import { calendarDateIn, DEFAULT_TIME_ZONE } from '@core/time/time-zone'

/** Saturday, 14 November 2026, 15:00 UTC: the day the fixtures of the tests are built around. */
export const TEST_NOW = new Date('2026-11-14T15:00:00.000Z')
export const TEST_TODAY: CalendarDate = '2026-11-14'

/** A clock that stands still until the test moves it. */
export class FakeClock implements Clock {
  private current: Date

  constructor(now: Date | string = TEST_NOW) {
    this.current = new Date(now)
  }

  now(): Date {
    return new Date(this.current)
  }

  set(now: Date | string): void {
    this.current = new Date(now)
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds)
  }
}

/**
 * "Today" for a use case test. By default it is what the clock says in UTC, the default zone (rule 0.2);
 * `setTimeZone` gives one person another zone, and `setToday` pins the date outright.
 */
export class FakeUserCalendar implements UserCalendar {
  private pinned?: CalendarDate
  private readonly timeZones = new Map<string, string>()

  constructor(private readonly clock: Clock = new FakeClock()) {}

  async today(userId: string): Promise<CalendarDate> {
    return this.pinned ?? calendarDateIn(this.timeZones.get(userId) ?? DEFAULT_TIME_ZONE, this.clock.now())
  }

  setToday(today: CalendarDate): void {
    this.pinned = today
  }

  setTimeZone(userId: string, timeZone: string): void {
    this.timeZones.set(userId, timeZone)
  }
}

export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR
