import { DomainError } from '@core/errors/domain-error'

export class EmailAlreadyVerifiedError extends DomainError {
  readonly code = 'AUTH.EMAIL_ALREADY_VERIFIED'
  readonly httpStatus = 409

  constructor() {
    super('This e-mail address is already confirmed.')
  }
}
