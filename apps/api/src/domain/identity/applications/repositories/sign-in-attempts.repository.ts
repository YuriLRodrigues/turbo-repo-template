/**
 * Rule 1.4: the wrong passwords typed for an e-mail. Kept in the database, so the limit holds across instances.
 * The e-mail is the normalised address (`Email.value`), whether or not an account exists for it.
 */
export abstract class SignInAttemptsRepository {
  abstract recordFailure(email: string, at: Date): Promise<void>
  /** When the failures since `since` happened, oldest first. */
  abstract findFailuresSince(email: string, since: Date): Promise<Date[]>
  /** A successful sign-in (or a password reset) starts the count again. */
  abstract clear(email: string): Promise<void>
  /** Housekeeping: failures older than `before` no longer matter. */
  abstract deleteOlderThan(email: string, before: Date): Promise<void>
}
