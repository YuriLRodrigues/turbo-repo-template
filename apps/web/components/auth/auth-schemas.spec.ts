import { describe, expect, it } from 'vitest'

import { resetPasswordSchema, signInSchema, signUpSchema } from './auth-schemas'

const messagesOf = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? []

describe('auth schemas', () => {
  it('trims the e-mail and asks for a valid one', () => {
    expect(signInSchema.parse({ email: '  jane@example.com ', password: 'x' }).email).toBe('jane@example.com')
    expect(messagesOf(signInSchema.safeParse({ email: 'jane', password: 'x' }))).toEqual(['Enter a valid e-mail.'])
    expect(messagesOf(signInSchema.safeParse({ email: '', password: '' }))).toEqual([
      'Enter your e-mail.',
      'Enter your password.',
    ])
  })

  it('keeps the password rules of the API on sign-up', () => {
    expect(signUpSchema.safeParse({ name: 'Jane', email: 'jane@example.com', password: 'secret12' }).success).toBe(true)
    expect(messagesOf(signUpSchema.safeParse({ name: ' ', email: 'jane@example.com', password: 'short' }))).toEqual([
      'Enter your name.',
      'Use at least 8 characters.',
    ])
  })

  it('asks for the same password twice when resetting it', () => {
    const result = resetPasswordSchema.safeParse({ password: 'secret123', confirmation: 'secret124' })

    expect(result.error?.issues[0]).toMatchObject({
      path: ['confirmation'],
      message: 'The two passwords are not the same.',
    })
  })
})
