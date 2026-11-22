import { DomainError } from '@core/errors/domain-error'

/**
 * Rule 1.3: a refresh token that was already exchanged showed up again. Someone else may hold a copy, so every
 * session of that family was ended.
 */
export class RefreshTokenReusedError extends DomainError {
  readonly code = 'AUTH.REFRESH_TOKEN_REUSED'
  readonly httpStatus = 401

  constructor() {
    super('This session was ended for safety. Sign in again.')
  }
}
