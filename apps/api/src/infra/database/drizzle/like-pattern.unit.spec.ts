import { describe, expect, it } from 'vitest'

import { containsPattern } from './like-pattern'

describe('containsPattern', () => {
  it('wraps the term in wildcards', () => {
    expect(containsPattern('milk')).toBe('%milk%')
  })

  it('escapes the characters ilike treats as wildcards', () => {
    expect(containsPattern('100%_off\\')).toBe('%100\\%\\_off\\\\%')
  })
})
