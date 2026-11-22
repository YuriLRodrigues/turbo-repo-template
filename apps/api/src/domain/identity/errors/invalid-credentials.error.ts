import { DomainError } from '@core/errors/domain-error'

/** Same error for an unknown e-mail and a wrong password, so the API does not reveal who has an account. */
export class InvalidCredentialsError extends DomainError {
  readonly code = 'AUTH.INVALID_CREDENTIALS'
  readonly httpStatus = 401

  constructor() {
    super('E-mail or password is incorrect.')
  }
}
