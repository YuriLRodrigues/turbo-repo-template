import { beforeEach, describe, expect, it } from 'vitest'

import { makeActor } from '@test/factories/make-user'
import { InMemoryPreferencesRepository } from '@test/repositories/in-memory-preferences.repository'
import { FakeClock, MINUTE, TEST_NOW } from '@test/time/fake-clock'

import { DEFAULT_APPEARANCE } from '../../enterprise/preferences/appearance'
import { InvalidAppearanceError } from '../../errors/invalid-appearance.error'
import { InvalidOnboardingError } from '../../errors/invalid-onboarding.error'
import { InvalidTimeZoneError } from '../../errors/invalid-time-zone.error'
import { UpdatePreferencesUseCase } from './update-preferences.use-case'

describe('UpdatePreferencesUseCase (rule 1.7)', () => {
  let preferencesRepository: InMemoryPreferencesRepository
  let clock: FakeClock
  let sut: UpdatePreferencesUseCase

  beforeEach(() => {
    preferencesRepository = new InMemoryPreferencesRepository()
    clock = new FakeClock()
    sut = new UpdatePreferencesUseCase(preferencesRepository, clock)
  })

  it('saves the first change on top of the defaults', async () => {
    const actor = makeActor()

    const result = await sut.execute({ actor, changes: { appearance: { accent: 'violet', density: 'compact' } } })

    if (result.isLeft()) throw result.value
    expect(result.value.preferences.appearance).toEqual({ ...DEFAULT_APPEARANCE, accent: 'violet', density: 'compact' })
    expect(result.value.preferences.updatedAt).toEqual(TEST_NOW)
    expect(preferencesRepository.items).toHaveLength(1)
    expect(preferencesRepository.items[0].userId.toString()).toBe(actor.id)
  })

  it('keeps what an earlier change saved', async () => {
    const actor = makeActor()
    await sut.execute({ actor, changes: { appearance: { theme: 'dark' }, timeZone: 'Europe/Lisbon' } })
    clock.advance(MINUTE)

    const result = await sut.execute({
      actor,
      changes: {
        appearance: { reduceMotion: true },
        onboarding: { currentStep: 'appearance', completedSteps: ['welcome'], skippedSteps: ['profile'] },
      },
    })

    if (result.isLeft()) throw result.value
    const { preferences } = result.value
    expect(preferences.appearance.theme).toBe('dark')
    expect(preferences.timeZone).toBe('Europe/Lisbon')
    expect(preferences.appearance.reduceMotion).toBe(true)
    expect(preferences.onboarding).toEqual({
      status: 'pending',
      currentStep: 'appearance',
      completedSteps: ['welcome'],
      skippedSteps: ['profile'],
    })
    expect(preferencesRepository.items).toHaveLength(1)
  })

  it('keeps each person their own preferences', async () => {
    const jane = makeActor()
    const john = makeActor()

    await sut.execute({ actor: jane, changes: { appearance: { theme: 'dark' } } })
    await sut.execute({ actor: john, changes: { appearance: { theme: 'light' } } })

    expect((await preferencesRepository.findByUserId(jane.id))?.appearance.theme).toBe('dark')
    expect((await preferencesRepository.findByUserId(john.id))?.appearance.theme).toBe('light')
  })

  it.each([
    [
      'an appearance value the design system does not have',
      { appearance: { accent: 'forest' } },
      InvalidAppearanceError,
    ],
    ['an unknown time zone', { timeZone: 'Mars/Olympus' }, InvalidTimeZoneError],
    ['an unknown onboarding step', { onboarding: { currentStep: 'payment' } }, InvalidOnboardingError],
  ])('refuses %s and saves nothing', async (_label, changes, error) => {
    const result = await sut.execute({ actor: makeActor(), changes })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(error)
    expect((result.value as InstanceType<typeof error>).httpStatus).toBe(422)
    expect(preferencesRepository.items).toHaveLength(0)
  })
})
