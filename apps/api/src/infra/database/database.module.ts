import { Module } from '@nestjs/common'

import { UnitOfWork } from '@core/persistence/unit-of-work'
import { PreferencesRepository } from '@domain/identity/applications/repositories/preferences.repository'
import { RefreshTokensRepository } from '@domain/identity/applications/repositories/refresh-tokens.repository'
import { SignInAttemptsRepository } from '@domain/identity/applications/repositories/sign-in-attempts.repository'
import { UserTokensRepository } from '@domain/identity/applications/repositories/user-tokens.repository'
import { UsersRepository } from '@domain/identity/applications/repositories/users.repository'
import { NotesRepository } from '@domain/notes/applications/repositories/notes.repository'

import { DrizzleService } from './drizzle/drizzle.service'
import { DrizzleUnitOfWork } from './drizzle/drizzle-unit-of-work'
import { DrizzleNotesRepository } from './drizzle/repositories/drizzle-notes.repository'
import { DrizzlePreferencesRepository } from './drizzle/repositories/drizzle-preferences.repository'
import { DrizzleRefreshTokensRepository } from './drizzle/repositories/drizzle-refresh-tokens.repository'
import { DrizzleSignInAttemptsRepository } from './drizzle/repositories/drizzle-sign-in-attempts.repository'
import { DrizzleUserTokensRepository } from './drizzle/repositories/drizzle-user-tokens.repository'
import { DrizzleUsersRepository } from './drizzle/repositories/drizzle-users.repository'

const bindings = [
  { provide: UnitOfWork, useClass: DrizzleUnitOfWork },
  // identity
  { provide: UsersRepository, useClass: DrizzleUsersRepository },
  { provide: RefreshTokensRepository, useClass: DrizzleRefreshTokensRepository },
  { provide: UserTokensRepository, useClass: DrizzleUserTokensRepository },
  { provide: SignInAttemptsRepository, useClass: DrizzleSignInAttemptsRepository },
  { provide: PreferencesRepository, useClass: DrizzlePreferencesRepository },
  // notes (the example context)
  { provide: NotesRepository, useClass: DrizzleNotesRepository },
]

/**
 * Binds each abstract repository or port (the DI token the use cases ask for) to its Drizzle implementation, and
 * the unit of work to a database transaction. A new context adds its lines here.
 */
@Module({
  providers: [DrizzleService, ...bindings],
  exports: [DrizzleService, ...bindings.map((binding) => binding.provide)],
})
export class DatabaseModule {}
