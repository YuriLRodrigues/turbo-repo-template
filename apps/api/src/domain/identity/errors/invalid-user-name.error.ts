import { DomainError } from '@core/errors/domain-error'

/** Rule 0.8: a name has up to 60 characters, and it is never empty. */
export class InvalidUserNameError extends DomainError {
  readonly code = 'USER.INVALID_NAME'
  readonly httpStatus = 422

  constructor(maxLength: number) {
    super(`The name must have between 1 and ${maxLength} characters.`, { maxLength })
  }
}
