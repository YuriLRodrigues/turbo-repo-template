import { DomainError } from '@core/errors/domain-error'

/** Rule 2.1: the body is optional and has a maximum size. */
export class InvalidNoteBodyError extends DomainError {
  readonly code = 'NOTE.INVALID_BODY'
  readonly httpStatus = 422

  constructor(maxLength: number) {
    super(`The body can have at most ${maxLength} characters.`, { maxLength })
  }
}
