import { Injectable } from '@nestjs/common'

import type { CalendarDate } from '@core/time/calendar-date'
import { Clock, type UserCalendar } from '@core/time/clock'
import { calendarDateIn, DEFAULT_TIME_ZONE } from '@core/time/time-zone'
import { PreferencesRepository } from '@domain/identity/applications/repositories/preferences.repository'

/**
 * Rule 0.2: "today" is the calendar date in the time zone the person chose in their preferences (UTC until
 * they choose one), at the instant the clock gives.
 */
@Injectable()
export class PreferencesUserCalendar implements UserCalendar {
  constructor(
    private readonly clock: Clock,
    private readonly preferencesRepository: PreferencesRepository,
  ) {}

  async today(userId: string): Promise<CalendarDate> {
    const preferences = await this.preferencesRepository.findByUserId(userId)

    return calendarDateIn(preferences?.timeZone ?? DEFAULT_TIME_ZONE, this.clock.now())
  }
}
