import { DomainError } from '@core/errors/domain-error'

/** Rule 1.4: five wrong passwords for the same e-mail in 15 minutes block new attempts for 15 minutes. */
export class TooManyAttemptsError extends DomainError {
  readonly code = 'AUTH.TOO_MANY_ATTEMPTS'
  readonly httpStatus = 429

  constructor(retryAfterSeconds: number) {
    super('Too many sign-in attempts. Try again later.', { retryAfterSeconds })
  }
}
