import { Injectable } from '@nestjs/common'

import type { UnitOfWork } from '@core/persistence/unit-of-work'

import { DrizzleService } from './drizzle.service'

/** The unit of work of the use cases is a database transaction. */
@Injectable()
export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly drizzle: DrizzleService) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.drizzle.transaction(work)
  }
}
