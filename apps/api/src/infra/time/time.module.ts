import { Module } from '@nestjs/common'

import { Clock, UserCalendar } from '@core/time/clock'
import { DatabaseModule } from '@infra/database/database.module'

import { PreferencesUserCalendar } from './preferences-user-calendar'
import { SystemClock } from './system-clock'

/** "Now" and "today". The e2e suite overrides `Clock` to pin the date; everything else follows it. */
@Module({
  imports: [DatabaseModule],
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: UserCalendar, useClass: PreferencesUserCalendar },
  ],
  exports: [Clock, UserCalendar],
})
export class TimeModule {}
