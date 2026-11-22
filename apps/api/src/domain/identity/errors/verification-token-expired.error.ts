import { DomainError } from '@core/errors/domain-error'

/** Rule 1.2: the e-mail confirmation link is valid for 24 hours. */
export class VerificationTokenExpiredError extends DomainError {
  readonly code = 'AUTH.VERIFICATION_TOKEN_EXPIRED'
  readonly httpStatus = 422

  constructor() {
    super('This confirmation link has expired. Ask for a new one.')
  }
}
