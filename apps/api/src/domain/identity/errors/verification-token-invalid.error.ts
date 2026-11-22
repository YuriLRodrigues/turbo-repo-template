import { DomainError } from '@core/errors/domain-error'

/** The e-mail confirmation link is unknown, was already used or was replaced by a newer one. */
export class VerificationTokenInvalidError extends DomainError {
  readonly code = 'AUTH.VERIFICATION_TOKEN_INVALID'
  readonly httpStatus = 422

  constructor() {
    super('This confirmation link is not valid. Ask for a new one.')
  }
}
