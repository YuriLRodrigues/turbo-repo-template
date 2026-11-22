import { DomainError } from '@core/errors/domain-error'

/** Rule 1.1: a password has 8 characters or more. */
export class WeakPasswordError extends DomainError {
  readonly code = 'USER.WEAK_PASSWORD'
  readonly httpStatus = 422

  constructor(minLength: number) {
    super(`The password must have at least ${minLength} characters.`, { minLength })
  }
}
