import { DomainError } from '@core/errors/domain-error'

/** Rule 2.2: an archived note is read-only until it is unarchived. */
export class NoteArchivedError extends DomainError {
  readonly code = 'NOTE.ARCHIVED'
  readonly httpStatus = 409

  constructor() {
    super('The note is archived. Unarchive it before changing it.')
  }
}
