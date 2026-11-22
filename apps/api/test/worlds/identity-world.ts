import { IdentityUserData } from '@domain/identity/applications/account-data/identity-user-data'
import { AccountLinkSender } from '@domain/identity/applications/services/account-link-sender'
import { SessionIssuer } from '@domain/identity/applications/services/session-issuer'

import { FakeEncrypter } from '../cryptography/fake-encrypter'
import { FakeHasher } from '../cryptography/fake-hasher'
import { FakeOpaqueTokens } from '../cryptography/fake-opaque-tokens'
import { FakeAccountLinks, FakeMailer } from '../mail/fake-mailer'
import { FakeUnitOfWork } from '../persistence/fake-unit-of-work'
import { InMemoryPreferencesRepository } from '../repositories/in-memory-preferences.repository'
import { InMemoryRefreshTokensRepository } from '../repositories/in-memory-refresh-tokens.repository'
import { InMemorySignInAttemptsRepository } from '../repositories/in-memory-sign-in-attempts.repository'
import { InMemoryUserTokensRepository } from '../repositories/in-memory-user-tokens.repository'
import { InMemoryUsersRepository } from '../repositories/in-memory-users.repository'
import { FakeClock } from '../time/fake-clock'

/**
 * Everything an identity use case can ask for, in memory and wired together. A spec builds one per test and passes
 * the pieces its use case needs to the constructor.
 */
export function makeIdentityWorld() {
  const clock = new FakeClock()
  const usersRepository = new InMemoryUsersRepository()
  const refreshTokensRepository = new InMemoryRefreshTokensRepository()
  const userTokensRepository = new InMemoryUserTokensRepository()
  const signInAttemptsRepository = new InMemorySignInAttemptsRepository()
  const preferencesRepository = new InMemoryPreferencesRepository()
  const hasher = new FakeHasher()
  const encrypter = new FakeEncrypter()
  const opaqueTokens = new FakeOpaqueTokens()
  const mailer = new FakeMailer()
  const accountLinks = new FakeAccountLinks()
  const unitOfWork = new FakeUnitOfWork()

  return {
    clock,
    usersRepository,
    refreshTokensRepository,
    userTokensRepository,
    signInAttemptsRepository,
    preferencesRepository,
    hasher,
    encrypter,
    opaqueTokens,
    mailer,
    accountLinks,
    unitOfWork,
    sessionIssuer: new SessionIssuer(refreshTokensRepository, opaqueTokens, encrypter),
    accountLinkSender: new AccountLinkSender(userTokensRepository, opaqueTokens, accountLinks, mailer),
    identityUserData: new IdentityUserData(
      usersRepository,
      preferencesRepository,
      refreshTokensRepository,
      userTokensRepository,
      signInAttemptsRepository,
      clock,
    ),
  }
}

export type IdentityWorld = ReturnType<typeof makeIdentityWorld>
