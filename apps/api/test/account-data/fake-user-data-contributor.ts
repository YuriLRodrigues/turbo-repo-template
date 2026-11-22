import { UserDataContributor } from '@domain/identity/applications/account-data/user-data-contributor'

/** A bounded context that keeps one list of rows per person, to test how the contributions are put together. */
export class FakeUserDataContributor extends UserDataContributor {
  rows = new Map<string, string[]>()
  /** Shared between contributors by the test, to read the order in which they were called. */
  calls: string[]

  constructor(
    readonly section: string,
    calls: string[] = [],
  ) {
    super()
    this.calls = calls
  }

  async export(userId: string): Promise<Record<string, unknown>> {
    this.calls.push(`export:${this.section}`)

    return { rows: this.rows.get(userId) ?? [] }
  }

  async erase(userId: string): Promise<void> {
    this.calls.push(`erase:${this.section}`)
    this.rows.delete(userId)
  }
}
