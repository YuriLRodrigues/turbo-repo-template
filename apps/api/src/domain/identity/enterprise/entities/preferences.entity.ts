import { AggregateRoot } from '@core/domain/aggregate-root'
import type { UniqueEntityId } from '@core/domain/unique-entity-id'
import { type Either, left, right } from '@core/logic/either'
import { DEFAULT_TIME_ZONE, isTimeZone } from '@core/time/time-zone'

import type { InvalidAppearanceError } from '../../errors/invalid-appearance.error'
import type { InvalidOnboardingError } from '../../errors/invalid-onboarding.error'
import { InvalidTimeZoneError } from '../../errors/invalid-time-zone.error'
import {
  type Appearance,
  type AppearanceChanges,
  changeAppearance,
  DEFAULT_APPEARANCE,
} from '../preferences/appearance'
import {
  changeOnboarding,
  DEFAULT_ONBOARDING,
  type OnboardingChanges,
  type OnboardingState,
} from '../preferences/onboarding'

export type PreferencesProps = {
  appearance: Appearance
  /** Rule 0.2: "today" and the limits of the month follow it. */
  timeZone: string
  onboarding: OnboardingState
  /** Empty while the person still has the defaults. */
  updatedAt: Date | null
}

/** Absent keys are kept. Inside `appearance` and `onboarding`, absent keys are kept as well. */
export type PreferencesChanges = {
  appearance?: AppearanceChanges
  timeZone?: unknown
  onboarding?: OnboardingChanges
}

export type PreferencesError = InvalidAppearanceError | InvalidTimeZoneError | InvalidOnboardingError

/** Rule 1.7. One per person: its id is the id of the user. */
export class Preferences extends AggregateRoot<PreferencesProps> {
  get userId(): UniqueEntityId {
    return this.id
  }

  get appearance(): Appearance {
    return this.props.appearance
  }

  get timeZone(): string {
    return this.props.timeZone
  }

  get onboarding(): OnboardingState {
    return this.props.onboarding
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt
  }

  /** Validates everything first: either every change is applied or none is. */
  change(changes: PreferencesChanges, now: Date): Either<PreferencesError, void> {
    const next = { ...this.props }

    if (changes.appearance !== undefined) {
      const appearance = changeAppearance(next.appearance, changes.appearance)
      if (appearance.isLeft()) return left(appearance.value)
      next.appearance = appearance.value
    }

    if (changes.timeZone !== undefined) {
      if (!isTimeZone(changes.timeZone)) return left(new InvalidTimeZoneError())
      next.timeZone = changes.timeZone
    }

    if (changes.onboarding !== undefined) {
      const onboarding = changeOnboarding(next.onboarding, changes.onboarding)
      if (onboarding.isLeft()) return left(onboarding.value)
      next.onboarding = onboarding.value
    }

    this.props = { ...next, updatedAt: now }

    return right(undefined)
  }

  /** What a person has before changing anything. */
  static defaultsFor(userId: UniqueEntityId): Preferences {
    return new Preferences(
      {
        appearance: { ...DEFAULT_APPEARANCE },
        timeZone: DEFAULT_TIME_ZONE,
        onboarding: { ...DEFAULT_ONBOARDING, completedSteps: [], skippedSteps: [] },
        updatedAt: null,
      },
      userId,
    )
  }

  /** Rebuilds preferences that already exist (mappers, factories). */
  static create(props: PreferencesProps, userId: UniqueEntityId): Preferences {
    return new Preferences(props, userId)
  }
}
