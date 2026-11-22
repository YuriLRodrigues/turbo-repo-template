import { DomainError } from '@core/errors/domain-error'

/** Rule 0.4: a note that does not exist and someone else's note answer the same. */
export class NoteNotFoundError extends DomainError {
  readonly code = 'NOTE.NOT_FOUND'
  readonly httpStatus = 404

  constructor() {
    super('Note not found.')
  }
}
