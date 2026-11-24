import { type Either, left, right } from '@core/logic/either'

import { InvalidAppearanceError } from '../../errors/invalid-appearance.error'

/**
 * Rule 1.7: how the app looks for one person. The value lists are the ones of the design system and must stay equal
 * to `packages/ui/src/appearance/options.ts` (the unit spec next to this file compares them).
 */
export const themeChoices = ['system', 'light', 'dark'] as const
export const accents = ['neutral', 'blue', 'violet', 'emerald', 'amber', 'rose'] as const
export const densities = ['comfortable', 'compact'] as const

export type Appearance = {
  theme: (typeof themeChoices)[number]
  accent: (typeof accents)[number]
  density: (typeof densities)[number]
  /** Transitions end at once and nothing loops, whatever the system says. */
  reduceMotion: boolean
}

export const DEFAULT_APPEARANCE: Appearance = {
  theme: 'system',
  accent: 'rose',
  density: 'comfortable',
  reduceMotion: false,
}

/** Only the keys that are present change; the others keep their current value. */
export type AppearanceChanges = Partial<Record<keyof Appearance, unknown>>

const CHOICES = {
  theme: themeChoices,
  accent: accents,
  density: densities,
} satisfies Record<Exclude<keyof Appearance, 'reduceMotion'>, readonly string[]>

export function changeAppearance(
  current: Appearance,
  changes: AppearanceChanges,
): Either<InvalidAppearanceError, Appearance> {
  const next: Record<string, unknown> = { ...current }

  for (const [field, allowed] of Object.entries(CHOICES)) {
    const value = changes[field as keyof Appearance]
    if (value === undefined) continue
    if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
      return left(new InvalidAppearanceError(field, allowed))
    }
    next[field] = value
  }

  if (changes.reduceMotion !== undefined) {
    if (typeof changes.reduceMotion !== 'boolean') {
      return left(new InvalidAppearanceError('reduceMotion', [true, false]))
    }
    next.reduceMotion = changes.reduceMotion
  }

  return right(next as Appearance)
}
