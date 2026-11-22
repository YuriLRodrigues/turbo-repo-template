import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { InvalidAppearanceError } from '../../errors/invalid-appearance.error'
import { accents, changeAppearance, DEFAULT_APPEARANCE, densities, themeChoices } from './appearance'

describe('changeAppearance (rule 1.7)', () => {
  it('changes only what was sent', () => {
    const result = changeAppearance(DEFAULT_APPEARANCE, { accent: 'violet', reduceMotion: true })

    expect(result.value).toEqual({ ...DEFAULT_APPEARANCE, accent: 'violet', reduceMotion: true })
  })

  it('keeps everything when nothing was sent', () => {
    expect(changeAppearance(DEFAULT_APPEARANCE, {}).value).toEqual(DEFAULT_APPEARANCE)
  })

  it.each([
    ['theme', 'sepia'],
    ['accent', 'pink'],
    ['density', 'tiny'],
    ['theme', 3],
    ['reduceMotion', 'yes'],
  ])('refuses %s = %s', (field, value) => {
    const result = changeAppearance(DEFAULT_APPEARANCE, { [field]: value })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidAppearanceError)
    expect((result.value as InvalidAppearanceError).details).toMatchObject({ field })
  })

  it('does not change the object it received', () => {
    const current = { ...DEFAULT_APPEARANCE }
    changeAppearance(current, { theme: 'dark' })

    expect(current).toEqual(DEFAULT_APPEARANCE)
  })
})

/**
 * The lists live twice: here and in the design system, which the web reads. This reads the design system's file
 * (never imports it: another workspace, React code) and fails when one side gains or loses a value.
 */
describe('appearance values match packages/ui', () => {
  const optionsFile = join(__dirname, '..', '..', '..', '..', '..', '..', '..', 'packages/ui/src/appearance/options.ts')
  const source = existsSync(optionsFile) ? readFileSync(optionsFile, 'utf8') : ''

  const listOf = (constant: string): string[] => {
    const match = new RegExp(`export const ${constant} = \\[([^\\]]*)\\] as const`).exec(source)
    if (!match) throw new Error(`${constant} was not found in ${optionsFile}`)

    return [...match[1].matchAll(/'([^']+)'/g)].map(([, value]) => value)
  }

  it.skipIf(!source)('has the same lists', () => {
    expect([...themeChoices]).toEqual(listOf('THEME_CHOICES'))
    expect([...accents]).toEqual(listOf('ACCENTS'))
    expect([...densities]).toEqual(listOf('DENSITIES'))
  })

  it.skipIf(!source)('has the same defaults', () => {
    const block = /export const DEFAULT_APPEARANCE: Appearance = \{([^}]*)\}/.exec(source)?.[1] ?? ''
    const defaults = Object.fromEntries(
      [...block.matchAll(/(\w+): ('([^']+)'|true|false)/g)].map(([, key, raw, text]) => [key, text ?? raw === 'true']),
    )

    expect(defaults).toEqual(DEFAULT_APPEARANCE)
  })
})
