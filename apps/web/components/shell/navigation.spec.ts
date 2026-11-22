import { describe, expect, it } from 'vitest'

import { isActivePath, NAVIGATION, normalizePath } from './navigation'

describe('navigation', () => {
  it('treats the trailing slash of the static export as the same place', () => {
    expect(normalizePath('/notes/')).toBe('/notes')
    expect(normalizePath('/')).toBe('/')
  })

  it('marks a place active on its own path and below it, and home only on itself', () => {
    expect(isActivePath('/notes/', '/notes')).toBe(true)
    expect(isActivePath('/notes/123/', '/notes')).toBe(true)
    expect(isActivePath('/notesbook', '/notes')).toBe(false)
    expect(isActivePath('/notes', '/')).toBe(false)
    expect(isActivePath('/', '/')).toBe(true)
  })

  it('has one entry per place, each with a unique path', () => {
    const paths = NAVIGATION.map((item) => item.href)

    expect(new Set(paths).size).toBe(paths.length)
  })
})
