import { beforeEach, describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { makeActor } from '@test/factories/make-user'
import { InMemoryPreferencesRepository } from '@test/repositories/in-memory-preferences.repository'
import { TEST_NOW } from '@test/time/fake-clock'

import { Preferences } from '../../enterprise/entities/preferences.entity'
import { DEFAULT_APPEARANCE } from '../../enterprise/preferences/appearance'
import { GetPreferencesUseCase } from './get-preferences.use-case'

describe('GetPreferencesUseCase (rule 1.7)', () => {
  let preferencesRepository: InMemoryPreferencesRepository
  let sut: GetPreferencesUseCase

  beforeEach(() => {
    preferencesRepository = new InMemoryPreferencesRepository()
    sut = new GetPreferencesUseCase(preferencesRepository)
  })

  it('answers the defaults for a person who never changed anything, without saving them', async () => {
    const actor = makeActor()

    const result = await sut.execute({ actor })

    expect(result.value.preferences.userId.toString()).toBe(actor.id)
    expect(result.value.preferences.appearance).toEqual(DEFAULT_APPEARANCE)
    expect(result.value.preferences.timeZone).toBe('UTC')
    expect(preferencesRepository.items).toHaveLength(0)
  })

  it('answers what the person saved, and nobody else gets it', async () => {
    const actor = makeActor()
    const saved = Preferences.defaultsFor(new UniqueEntityId(actor.id))
    saved.change({ appearance: { theme: 'dark' }, timeZone: 'Europe/Lisbon' }, TEST_NOW)
    preferencesRepository.items.push(saved)

    const own = await sut.execute({ actor })
    const other = await sut.execute({ actor: makeActor() })

    expect(own.value.preferences).toBe(saved)
    expect(other.value.preferences.appearance.theme).toBe('system')
  })
})
