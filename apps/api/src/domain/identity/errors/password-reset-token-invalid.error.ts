import { DomainError } from '@core/errors/domain-error'

/** Rule 1.5: the password link is single use. It is unknown, was already used or was replaced by a newer one. */
export class PasswordResetTokenInvalidError extends DomainError {
  readonly code = 'AUTH.PASSWORD_RESET_TOKEN_INVALID'
  readonly httpStatus = 422

  constructor() {
    super('This password link is not valid. Ask for a new one.')
  }
}
