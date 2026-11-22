import { DomainError } from '@core/errors/domain-error'

export class EmailAlreadyInUseError extends DomainError {
  readonly code = 'USER.EMAIL_IN_USE'
  readonly httpStatus = 409

  constructor() {
    super('This e-mail address is already registered.')
  }
}
