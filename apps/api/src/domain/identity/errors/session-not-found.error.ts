import { DomainError } from '@core/errors/domain-error'

export class SessionNotFoundError extends DomainError {
  readonly code = 'SESSION.NOT_FOUND'
  readonly httpStatus = 404

  constructor() {
    super('Session not found.')
  }
}
