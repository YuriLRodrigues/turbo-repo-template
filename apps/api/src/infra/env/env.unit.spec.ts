import { describe, expect, it } from 'vitest'

import { parseEnv } from './env'

const valid = {
  DATABASE_URL: 'postgresql://app:app@localhost:5432/app',
  JWT_SECRET: 'a'.repeat(32),
}

describe('parseEnv', () => {
  it('applies the defaults', () => {
    expect(parseEnv(valid)).toEqual({
      ...valid,
      NODE_ENV: 'development',
      APP_NAME: 'App',
      PORT: 3500,
      DATABASE_POOL_MAX: 10,
      PGLITE_PORT: 0,
      JWT_EXPIRES_IN_SECONDS: 900,
      AUTH_COOKIE_SAME_SITE: 'lax',
      CORS_ORIGINS: ['http://localhost:3501'],
      TRUST_PROXY_HOPS: 0,
      PUBLIC_RATE_LIMIT: 30,
      PUBLIC_RATE_WINDOW_SECONDS: 60,
      WEB_APP_URL: 'http://localhost:3501',
      MAIL_FROM: 'App <no-reply@example.com>',
      SMTP_PORT: 587,
      SMTP_SECURE: false,
    })
  })

  it('coerces numbers and flags', () => {
    const env = parseEnv({ ...valid, PORT: '8080', SMTP_SECURE: 'TRUE', PGLITE_PORT: '5544' })

    expect(env.PORT).toBe(8080)
    expect(env.SMTP_SECURE).toBe(true)
    expect(env.PGLITE_PORT).toBe(5544)
  })

  it('lists every invalid variable', () => {
    expect(() => parseEnv({ DATABASE_URL: 'mysql://localhost', JWT_SECRET: 'short' })).toThrow(
      /DATABASE_URL[\s\S]*JWT_SECRET/,
    )
    expect(() => parseEnv({ ...valid, SMTP_SECURE: 'maybe' })).toThrow(/SMTP_SECURE/)
  })

  it('treats a variable left empty as absent', () => {
    const env = parseEnv({ ...valid, SMTP_HOST: '', PORT: '  ', CORS_ORIGINS: '' })

    expect(env.SMTP_HOST).toBeUndefined()
    expect(env.PORT).toBe(3500)
    expect(env.CORS_ORIGINS).toEqual(['http://localhost:3501'])
  })

  it('reads the list of origins', () => {
    const env = parseEnv({ ...valid, CORS_ORIGINS: 'https://app.example.com/, capacitor://localhost ,' })

    expect(env.CORS_ORIGINS).toEqual(['https://app.example.com', 'capacitor://localhost'])
    expect(() => parseEnv({ ...valid, CORS_ORIGINS: 'not a url' })).toThrow(/CORS_ORIGINS/)
  })

  describe('the embedded database', () => {
    it('lets development run without DATABASE_URL', () => {
      const env = parseEnv({ JWT_SECRET: valid.JWT_SECRET })

      expect(env.DATABASE_URL).toBeUndefined()
      expect(env.NODE_ENV).toBe('development')
    })

    it.each(['test', 'production'])('requires DATABASE_URL in %s', (NODE_ENV) => {
      expect(() => parseEnv({ JWT_SECRET: valid.JWT_SECRET, NODE_ENV, SMTP_HOST: 'smtp.example.com' })).toThrow(
        /DATABASE_URL is required outside development/,
      )
    })
  })

  describe('e-mail (rule 1.2)', () => {
    it('requires an SMTP server in production', () => {
      expect(() => parseEnv({ ...valid, NODE_ENV: 'production' })).toThrow(/SMTP_HOST is required in production/)
      expect(parseEnv({ ...valid, NODE_ENV: 'production', SMTP_HOST: 'smtp.example.com' }).SMTP_HOST).toBe(
        'smtp.example.com',
      )
    })

    it('wants the SMTP user and password together', () => {
      expect(() => parseEnv({ ...valid, SMTP_HOST: 'smtp.example.com', SMTP_USER: 'mailer' })).toThrow(/SMTP_PASSWORD/)
      expect(() => parseEnv({ ...valid, SMTP_HOST: 'smtp.example.com', SMTP_PASSWORD: 'secret' })).toThrow(/SMTP_USER/)
    })
  })
})
