import { describe, expect, it } from 'vitest'

import { readCookie } from './cookies'

describe('readCookie', () => {
  it('finds a cookie among others', () => {
    const header = 'theme=dark; app.refresh_token=abc-123_XYZ; other=1'

    expect(readCookie(header, 'app.refresh_token')).toBe('abc-123_XYZ')
    expect(readCookie(header, 'theme')).toBe('dark')
  })

  it('decodes the value and drops the quotes', () => {
    expect(readCookie('token=a%20b%3Dc', 'token')).toBe('a b=c')
    expect(readCookie('token="quoted"', 'token')).toBe('quoted')
  })

  it('keeps an equals sign inside the value', () => {
    expect(readCookie('token=abc==', 'token')).toBe('abc==')
  })

  it('does not confuse a cookie with another whose name ends the same way', () => {
    expect(readCookie('not_token=1', 'token')).toBeUndefined()
  })

  it.each([undefined, '', 'other=1', 'token=', 'token', 'token=%E0%A4%A'])('is undefined for %s', (header) => {
    expect(readCookie(header, 'token')).toBeUndefined()
  })
})
