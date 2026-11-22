import type { UnitOfWork } from '@core/persistence/unit-of-work'

/** Runs the work right away, with no transaction: in-memory repositories have nothing to roll back. */
export class FakeUnitOfWork implements UnitOfWork {
  /** How many units of work were opened, for the tests that care that there was one. */
  runs = 0

  async run<T>(work: () => Promise<T>): Promise<T> {
    this.runs += 1

    return work()
  }
}
