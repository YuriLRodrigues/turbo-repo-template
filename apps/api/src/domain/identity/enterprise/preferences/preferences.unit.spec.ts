import { describe, expect, it } from 'vitest'

import { UniqueEntityId } from '@core/domain/unique-entity-id'

import { InvalidAppearanceError } from '../../errors/invalid-appearance.error'
import { InvalidOnboardingError } from '../../errors/invalid-onboarding.error'
import { InvalidTimeZoneError } from '../../errors/invalid-time-zone.error'
import { Preferences } from '../entities/preferences.entity'
import { DEFAULT_APPEARANCE } from './appearance'
import { changeOnboarding, DEFAULT_ONBOARDING, restoreOnboarding } from './onboarding'

const now = new Date('2026-11-14T15:00:00Z')

describe('onboarding state (rule 1.8)', () => {
  it('starts pending, at the welcome step', () => {
    expect(DEFAULT_ONBOARDING).toEqual({
      status: 'pending',
      currentStep: 'welcome',
      completedSteps: [],
      skippedSteps: [],
    })
  })

  it('saves the progress, with the steps in the order of the flow', () => {
    const result = changeOnboarding(DEFAULT_ONBOARDING, {
      currentStep: 'appearance',
      completedSteps: ['profile', 'welcome'],
      skippedSteps: [],
    })

    expect(result.value).toEqual({
      status: 'pending',
      currentStep: 'appearance',
      completedSteps: ['welcome', 'profile'],
      skippedSteps: [],
    })
  })

  it('can be dismissed, finished and reopened', () => {
    const dismissed = changeOnboarding(DEFAULT_ONBOARDING, { status: 'dismissed' })
    expect(dismissed.value).toMatchObject({ status: 'dismissed' })

    const reopened = changeOnboarding({ ...DEFAULT_ONBOARDING, status: 'finished' }, { status: 'pending' })
    expect(reopened.value).toMatchObject({ status: 'pending' })
  })

  it.each([
    [{ status: 'done' }],
    [{ currentStep: 'payment' }],
    [{ completedSteps: 'welcome' }],
    [{ completedSteps: ['welcome', 'unknown'] }],
    [{ skippedSteps: ['profile', 'profile'] }],
    [{ completedSteps: ['profile'], skippedSteps: ['profile'] }],
  ])('refuses %j', (changes) => {
    const result = changeOnboarding(DEFAULT_ONBOARDING, changes)

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidOnboardingError)
  })

  it('refuses a step skipped now that was completed before', () => {
    const current = { ...DEFAULT_ONBOARDING, completedSteps: ['profile' as const] }

    expect(changeOnboarding(current, { skippedSteps: ['profile'] }).value).toBeInstanceOf(InvalidOnboardingError)
  })

  it('fills what an older row does not have', () => {
    expect(restoreOnboarding({ status: 'finished' })).toEqual({ ...DEFAULT_ONBOARDING, status: 'finished' })
  })
})

describe('Preferences', () => {
  it('has the defaults before anything changes', () => {
    const userId = new UniqueEntityId()
    const preferences = Preferences.defaultsFor(userId)

    expect(preferences.userId.equals(userId)).toBe(true)
    expect(preferences.appearance).toEqual(DEFAULT_APPEARANCE)
    expect(preferences.timeZone).toBe('UTC')
    expect(preferences.onboarding).toEqual(DEFAULT_ONBOARDING)
    expect(preferences.updatedAt).toBeNull()
  })

  it('applies every change and records when', () => {
    const preferences = Preferences.defaultsFor(new UniqueEntityId())

    const result = preferences.change(
      {
        appearance: { theme: 'dark' },
        timeZone: 'Europe/Lisbon',
        onboarding: { status: 'finished', currentStep: 'done' },
      },
      now,
    )

    expect(result.isRight()).toBe(true)
    expect(preferences.appearance).toEqual({ ...DEFAULT_APPEARANCE, theme: 'dark' })
    expect(preferences.timeZone).toBe('Europe/Lisbon')
    expect(preferences.onboarding).toMatchObject({ status: 'finished', currentStep: 'done' })
    expect(preferences.updatedAt).toEqual(now)
  })

  it.each([
    [{ appearance: { accent: 'pink' } }, InvalidAppearanceError],
    [{ timeZone: 'Mars/Olympus' }, InvalidTimeZoneError],
    [{ timeZone: 3 }, InvalidTimeZoneError],
    [{ onboarding: { currentStep: 'nowhere' } }, InvalidOnboardingError],
  ])('refuses %j', (changes, error) => {
    const preferences = Preferences.defaultsFor(new UniqueEntityId())

    expect(preferences.change(changes, now).value).toBeInstanceOf(error)
  })

  it('applies nothing when one of the changes is invalid', () => {
    const preferences = Preferences.defaultsFor(new UniqueEntityId())

    preferences.change({ appearance: { theme: 'dark' }, timeZone: 'Mars/Olympus' }, now)

    expect(preferences.appearance).toEqual(DEFAULT_APPEARANCE)
    expect(preferences.updatedAt).toBeNull()
  })
})
