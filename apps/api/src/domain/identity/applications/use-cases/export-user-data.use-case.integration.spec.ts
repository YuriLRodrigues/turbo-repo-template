import { beforeEach, describe, expect, it } from 'vitest'

import { FakeUserDataContributor } from '@test/account-data/fake-user-data-contributor'
import { actorOf, makeActor, makeUser } from '@test/factories/make-user'
import { FakeUserCalendar, TEST_NOW, TEST_TODAY } from '@test/time/fake-clock'
import { type IdentityWorld, makeIdentityWorld } from '@test/worlds/identity-world'

import { Preferences } from '../../enterprise/entities/preferences.entity'
import { Email } from '../../enterprise/value-objects/email'
import { UserNotFoundError } from '../../errors/user-not-found.error'
import { UserDataContributors } from '../account-data/user-data-contributor'
import { ExportUserDataUseCase } from './export-user-data.use-case'

describe('ExportUserDataUseCase (rule 1.6)', () => {
  let world: IdentityWorld
  let notes: FakeUserDataContributor
  let files: FakeUserDataContributor
  let userCalendar: FakeUserCalendar
  let sut: ExportUserDataUseCase

  beforeEach(() => {
    world = makeIdentityWorld()
    notes = new FakeUserDataContributor('notes')
    files = new FakeUserDataContributor('files')
    userCalendar = new FakeUserCalendar(world.clock)
    sut = new ExportUserDataUseCase(
      world.usersRepository,
      new UserDataContributors([world.identityUserData, notes, files]),
      userCalendar,
      world.clock,
    )
  })

  it("dates the export with the day in the person's time zone (rule 0.2)", async () => {
    const user = makeUser()
    world.usersRepository.items.push(user)
    // 20:00 of the 14th in New York is already the 15th in UTC (the default zone) and in Lisbon.
    world.clock.set('2026-11-15T01:00:00.000Z')

    const inUtc = await sut.execute({ actor: actorOf(user) })
    userCalendar.setTimeZone(user.id.toString(), 'America/New_York')
    const inNewYork = await sut.execute({ actor: actorOf(user) })
    userCalendar.setTimeZone(user.id.toString(), 'Europe/Lisbon')
    const inLisbon = await sut.execute({ actor: actorOf(user) })

    if (inUtc.isLeft() || inNewYork.isLeft() || inLisbon.isLeft()) throw new Error('the export failed')
    expect(inUtc.value.document.exportedAt).toBe('2026-11-15T01:00:00.000Z')
    expect(inUtc.value.exportedOn).toBe('2026-11-15')
    expect(inNewYork.value.exportedOn).toBe(TEST_TODAY)
    expect(inLisbon.value.exportedOn).toBe('2026-11-15')
  })

  it('puts the part of every bounded context in one document', async () => {
    const user = makeUser({ name: 'Jane Doe', email: Email.restore('jane@example.com'), createdAt: TEST_NOW })
    world.usersRepository.items.push(user)
    notes.rows.set(user.id.toString(), ['First note', 'Second note'])
    files.rows.set(user.id.toString(), ['report.pdf'])

    const result = await sut.execute({ actor: actorOf(user) })

    if (result.isLeft()) throw result.value
    expect(result.value.document).toEqual({
      format: 'app.export',
      version: 1,
      exportedAt: TEST_NOW.toISOString(),
      data: {
        identity: {
          profile: {
            id: user.id.toString(),
            name: 'Jane Doe',
            email: 'jane@example.com',
            emailVerifiedAt: null,
            createdAt: TEST_NOW.toISOString(),
          },
          preferences: null,
          sessions: [],
        },
        notes: { rows: ['First note', 'Second note'] },
        files: { rows: ['report.pdf'] },
      },
    })
    expect(Object.keys(result.value.document.data)).toEqual(['identity', 'notes', 'files'])
  })

  it('includes the preferences and the open sessions, and never a secret', async () => {
    const user = makeUser({ emailVerifiedAt: TEST_NOW })
    world.usersRepository.items.push(user)
    const preferences = Preferences.defaultsFor(user.id)
    preferences.change({ appearance: { theme: 'dark' }, timeZone: 'Europe/Lisbon' }, TEST_NOW)
    world.preferencesRepository.items.push(preferences)
    const session = await world.sessionIssuer.issue(user, { now: world.clock.now(), userAgent: 'Firefox' })

    const result = await sut.execute({ actor: actorOf(user) })

    if (result.isLeft()) throw result.value
    const { identity } = result.value.document.data
    expect(identity.profile).toMatchObject({ emailVerifiedAt: TEST_NOW.toISOString() })
    expect(identity.preferences).toMatchObject({
      timeZone: 'Europe/Lisbon',
      appearance: { theme: 'dark' },
      updatedAt: TEST_NOW.toISOString(),
    })
    expect(identity.sessions).toEqual([
      {
        id: session.sessionId,
        createdAt: TEST_NOW.toISOString(),
        lastUsedAt: TEST_NOW.toISOString(),
        expiresAt: session.refreshTokenExpiresAt.toISOString(),
        userAgent: 'Firefox',
      },
    ])

    const text = JSON.stringify(result.value.document)
    expect(text).not.toContain(user.passwordHash)
    expect(text).not.toContain(session.refreshToken)
    expect(text).not.toContain(world.opaqueTokens.hash(session.refreshToken))
  })

  it("contains only the person's own data", async () => {
    const jane = makeUser()
    const john = makeUser()
    world.usersRepository.items.push(jane, john)
    notes.rows.set(john.id.toString(), ["John's note"])

    const result = await sut.execute({ actor: actorOf(jane) })

    if (result.isLeft()) throw result.value
    expect(result.value.document.data.notes).toEqual({ rows: [] })
    expect(JSON.stringify(result.value.document)).not.toContain(john.email.value)
  })

  it('fails when the account no longer exists', async () => {
    const result = await sut.execute({ actor: makeActor() })

    expect(result.value).toBeInstanceOf(UserNotFoundError)
  })
})
