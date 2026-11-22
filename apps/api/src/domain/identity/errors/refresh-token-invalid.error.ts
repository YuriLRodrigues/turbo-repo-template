import { DomainError } from '@core/errors/domain-error'

/** The refresh token is missing, unknown or was revoked (sign-out, password change, a session ended elsewhere). */
export class RefreshTokenInvalidError extends DomainError {
  readonly code = 'AUTH.REFRESH_TOKEN_INVALID'
  readonly httpStatus = 401

  constructor() {
    super('The session is not valid. Sign in again.')
  }
}
