import { DomainError } from '@core/errors/domain-error'

export class InvalidEmailError extends DomainError {
  readonly code = 'USER.INVALID_EMAIL'
  readonly httpStatus = 422

  constructor() {
    super('The e-mail address is not valid.')
  }
}
