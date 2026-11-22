import { beforeEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { Preferences } from '@domain/identity/enterprise/entities/preferences.entity'
import { InMemoryPreferencesRepository } from '@test/repositories/in-memory-preferences.repository'
import { FakeClock } from '@test/time/fake-clock'

import { PreferencesUserCalendar } from './preferences-user-calendar'

describe('PreferencesUserCalendar (rule 0.2)', () => {
  let clock: FakeClock
  let preferencesRepository: InMemoryPreferencesRepository
  let sut: PreferencesUserCalendar

  beforeEach(() => {
    // 01:30 UTC on the 15th: already the 15th in UTC (the default zone), still the 14th in New York.
    clock = new FakeClock('2026-11-15T01:30:00Z')
    preferencesRepository = new InMemoryPreferencesRepository()
    sut = new PreferencesUserCalendar(clock, preferencesRepository)
  })

  it('uses UTC for a person who never chose a time zone', async () => {
    expect(await sut.today(new UniqueEntityId().toString())).toBe('2026-11-15')
  })

  it("uses the time zone of the person's preferences", async () => {
    const userId = new UniqueEntityId()
    const preferences = Preferences.defaultsFor(userId)
    preferences.change({ timeZone: 'America/New_York' }, clock.now())
    preferencesRepository.items.push(preferences)

    expect(await sut.today(userId.toString())).toBe('2026-11-14')
    expect(await sut.today(new UniqueEntityId().toString())).toBe('2026-11-15')
  })

  it('follows the clock', async () => {
    const userId = new UniqueEntityId().toString()
    clock.set('2026-11-30T23:59:59Z')
    expect(await sut.today(userId)).toBe('2026-11-30')

    clock.set('2026-12-01T00:00:00Z')
    expect(await sut.today(userId)).toBe('2026-12-01')
  })
})
