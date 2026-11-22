import { DomainError } from '@core/errors/domain-error'

/** Rule 1.3: a refresh token lasts 30 days. */
export class RefreshTokenExpiredError extends DomainError {
  readonly code = 'AUTH.REFRESH_TOKEN_EXPIRED'
  readonly httpStatus = 401

  constructor() {
    super('The session has expired. Sign in again.')
  }
}
