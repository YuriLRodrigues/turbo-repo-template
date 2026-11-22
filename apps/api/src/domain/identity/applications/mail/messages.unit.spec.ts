import { describe, expect, it } from 'vitest'

import { emailVerificationMessage, passwordResetMessage } from './messages'

describe('identity e-mails', () => {
  it('writes the confirmation e-mail (rule 1.2)', () => {
    const message = emailVerificationMessage({
      to: 'jane@example.com',
      name: 'Jane Doe',
      link: 'https://app.example.test/verify-email?token=abc',
      appName: 'Example',
    })

    expect(message.to).toBe('jane@example.com')
    expect(message.subject).toBe('Confirm your e-mail for Example')
    expect(message.text).toBe(
      [
        'Hi Jane,',
        '',
        'To confirm your e-mail for Example, open the link below. It is valid for 24 hours.',
        '',
        'https://app.example.test/verify-email?token=abc',
        '',
        'If you did not create an account on Example, ignore this message.',
      ].join('\n'),
    )
  })

  it('writes the password e-mail (rule 1.5)', () => {
    const message = passwordResetMessage({
      to: 'jane@example.com',
      name: '  Jane   Doe ',
      link: 'https://app.example.test/reset-password?token=abc',
      appName: 'Example',
    })

    expect(message.subject).toBe('Choose a new password for Example')
    expect(message.text).toContain('Hi Jane,')
    expect(message.text).toContain('It is valid for 1 hour and works only once.')
    expect(message.text).toContain('https://app.example.test/reset-password?token=abc')
    expect(message.text).toContain('your password stays the same')
  })

  it('greets without a name when there is none', () => {
    const message = emailVerificationMessage({ to: 'a@b.co', name: '   ', link: 'x', appName: 'Example' })

    expect(message.text.startsWith('Hi,\n')).toBe(true)
  })
})
