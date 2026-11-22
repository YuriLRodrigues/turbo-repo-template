import { DomainError } from '@core/errors/domain-error'

/** Rule 1.5: the password link is valid for 1 hour. */
export class PasswordResetTokenExpiredError extends DomainError {
  readonly code = 'AUTH.PASSWORD_RESET_TOKEN_EXPIRED'
  readonly httpStatus = 422

  constructor() {
    super('This password link has expired. Ask for a new one.')
  }
}
