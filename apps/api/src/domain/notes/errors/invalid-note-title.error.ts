import { DomainError } from '@core/errors/domain-error'

/** Rule 2.1: a title is required and has a maximum size. */
export class InvalidNoteTitleError extends DomainError {
  readonly code = 'NOTE.INVALID_TITLE'
  readonly httpStatus = 422

  constructor(maxLength: number) {
    super(`The title must have between 1 and ${maxLength} characters.`, { maxLength })
  }
}
