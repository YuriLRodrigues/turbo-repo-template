import { describe, expect, it } from 'vitest'

import { cleanHexColor, cleanName, cleanOptionalText, foldText, isSlug } from './text'

describe('foldText', () => {
  it('ignores case, accents and repeated spaces', () => {
    expect(foldText('  Crème  BRÛLÉE ')).toBe('creme brulee')
    expect(foldText('Façade renovation')).toBe('facade renovation')
    expect(foldText('CAFÉ')).toBe(foldText('cafe'))
    expect(foldText('Ångström and Müller')).toBe('angstrom and muller')
  })

  it('keeps digits and punctuation', () => {
    expect(foldText('Order*Ref 1234')).toBe('order*ref 1234')
  })
})

describe('cleanName (rule 0.8)', () => {
  it('trims and joins spaces', () => {
    expect(cleanName('  Weekly   plan ')).toBe('Weekly plan')
  })

  it('refuses an empty name and one longer than 60 characters', () => {
    expect(cleanName('   ')).toBeNull()
    expect(cleanName('a'.repeat(60))).toBe('a'.repeat(60))
    expect(cleanName('a'.repeat(61))).toBeNull()
  })

  it('takes another limit', () => {
    expect(cleanName('abcdef', 5)).toBeNull()
  })
})

describe('cleanOptionalText (rule 0.8)', () => {
  it('treats blank as none', () => {
    expect(cleanOptionalText(undefined, 140)).toEqual({ valid: true, value: null })
    expect(cleanOptionalText(null, 140)).toEqual({ valid: true, value: null })
    expect(cleanOptionalText('   ', 140)).toEqual({ valid: true, value: null })
  })

  it('trims the ends and keeps the line breaks inside', () => {
    expect(cleanOptionalText('  first line\nsecond line  ', 500)).toEqual({
      valid: true,
      value: 'first line\nsecond line',
    })
  })

  it('refuses a text longer than the limit', () => {
    expect(cleanOptionalText('a'.repeat(140), 140)).toEqual({ valid: true, value: 'a'.repeat(140) })
    expect(cleanOptionalText('a'.repeat(141), 140)).toEqual({ valid: false })
  })
})

describe('cleanHexColor', () => {
  it('stores #rrggbb in lower case', () => {
    expect(cleanHexColor(' #EC7000 ')).toBe('#ec7000')
  })

  it.each(['ec7000', '#fff', '#12345g', 'red', '#1234567', ''])('refuses %s', (raw) => {
    expect(cleanHexColor(raw)).toBeNull()
  })
})

describe('isSlug', () => {
  it('accepts lower-case words joined by hyphens', () => {
    expect(isSlug('cart', 40)).toBe(true)
    expect(isSlug('shopping-bag', 40)).toBe(true)
    expect(isSlug('block-2', 40)).toBe(true)
  })

  it.each(['', 'Cart', 'two words', '-cart', 'cart-', 'a--b', 'x'.repeat(41), 7, null])('refuses %s', (value) => {
    expect(isSlug(value, 40)).toBe(false)
  })
})
