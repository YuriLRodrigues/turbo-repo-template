import { type Either, left, right } from '@core/logic/either'

import { InvalidOnboardingError } from '../../errors/invalid-onboarding.error'

/** Rule 1.8: welcome -> profile -> appearance -> done. A new product adds its own steps here (and in the web app). */
export const onboardingSteps = ['welcome', 'profile', 'appearance', 'done'] as const

export type OnboardingStep = (typeof onboardingSteps)[number]

/**
 * Rule 1.8. `pending`: the "continue setup" card shows on the home screen. `finished`: the person went through it.
 * `dismissed`: the person closed the card ("skip everything"). Reopening it in the settings sets it back to `pending`.
 */
export const onboardingStatuses = ['pending', 'finished', 'dismissed'] as const

export type OnboardingStatus = (typeof onboardingStatuses)[number]

export type OnboardingState = {
  status: OnboardingStatus
  /** Where to resume. */
  currentStep: OnboardingStep
  completedSteps: OnboardingStep[]
  /** Rule 1.8: every step can be skipped. */
  skippedSteps: OnboardingStep[]
}

export const DEFAULT_ONBOARDING: OnboardingState = {
  status: 'pending',
  currentStep: 'welcome',
  completedSteps: [],
  skippedSteps: [],
}

export type OnboardingChanges = Partial<Record<keyof OnboardingState, unknown>>

const isStep = (value: unknown): value is OnboardingStep => onboardingSteps.includes(value as OnboardingStep)

function readSteps(value: unknown, field: string): Either<InvalidOnboardingError, OnboardingStep[]> {
  if (!Array.isArray(value) || !value.every(isStep)) {
    return left(new InvalidOnboardingError(`"${field}" must be a list of steps (${onboardingSteps.join(', ')})`))
  }
  if (new Set(value).size !== value.length) {
    return left(new InvalidOnboardingError(`"${field}" lists a step more than once`))
  }

  // Stored in the order of the flow, whatever order they arrived in.
  return right(onboardingSteps.filter((step) => value.includes(step)))
}

export function changeOnboarding(
  current: OnboardingState,
  changes: OnboardingChanges,
): Either<InvalidOnboardingError, OnboardingState> {
  const next: OnboardingState = { ...current }

  if (changes.status !== undefined) {
    if (!onboardingStatuses.includes(changes.status as OnboardingStatus)) {
      return left(new InvalidOnboardingError(`"status" must be one of ${onboardingStatuses.join(', ')}`))
    }
    next.status = changes.status as OnboardingStatus
  }

  if (changes.currentStep !== undefined) {
    if (!isStep(changes.currentStep)) {
      return left(new InvalidOnboardingError(`"currentStep" must be one of ${onboardingSteps.join(', ')}`))
    }
    next.currentStep = changes.currentStep
  }

  for (const field of ['completedSteps', 'skippedSteps'] as const) {
    if (changes[field] === undefined) continue
    const steps = readSteps(changes[field], field)
    if (steps.isLeft()) return left(steps.value)
    next[field] = steps.value
  }

  const both = next.completedSteps.find((step) => next.skippedSteps.includes(step))
  if (both) return left(new InvalidOnboardingError(`the step "${both}" cannot be both completed and skipped`))

  return right(next)
}

/** A row saved before a field existed gets the default for it. */
export function restoreOnboarding(stored: Partial<OnboardingState> | null | undefined): OnboardingState {
  return { ...DEFAULT_ONBOARDING, ...stored }
}
