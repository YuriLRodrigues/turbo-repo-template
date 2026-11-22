import { Injectable } from '@nestjs/common'

import type { Clock } from '@core/time/clock'

@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}
