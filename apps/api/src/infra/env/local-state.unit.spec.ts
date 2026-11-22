import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { applyDevelopmentDefaults } from './local-state'

describe('applyDevelopmentDefaults', () => {
  let stateDir: string

  beforeEach(() => {
    stateDir = join(mkdtempSync(join(tmpdir(), 'app-state-')), 'nested')
  })

  afterEach(() => {
    rmSync(join(stateDir, '..'), { recursive: true, force: true })
  })

  it('creates a secret once and reuses it on the next start', () => {
    const first: Record<string, string | undefined> = {}
    const second: Record<string, string | undefined> = { NODE_ENV: 'development' }

    expect(applyDevelopmentDefaults(first, stateDir)).toEqual({ generatedJwtSecret: true })
    expect(applyDevelopmentDefaults(second, stateDir)).toEqual({ generatedJwtSecret: true })

    expect(first.JWT_SECRET).toHaveLength(64)
    expect(second.JWT_SECRET).toBe(first.JWT_SECRET)
    expect(readFileSync(join(stateDir, 'dev-jwt-secret'), 'utf8').trim()).toBe(first.JWT_SECRET)
  })

  it('keeps the secret that was configured', () => {
    const env = { JWT_SECRET: 'configured-secret-with-at-least-32-characters' }

    expect(applyDevelopmentDefaults(env, stateDir)).toEqual({ generatedJwtSecret: false })
    expect(env.JWT_SECRET).toBe('configured-secret-with-at-least-32-characters')
  })

  it.each(['production', 'test'])('fills nothing in %s', (NODE_ENV) => {
    const env: Record<string, string | undefined> = { NODE_ENV }

    expect(applyDevelopmentDefaults(env, stateDir)).toEqual({ generatedJwtSecret: false })
    expect(env.JWT_SECRET).toBeUndefined()
  })
})
