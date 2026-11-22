import { DomainError } from '@core/errors/domain-error'

export class UserNotFoundError extends DomainError {
  readonly code = 'USER.NOT_FOUND'
  readonly httpStatus = 404

  constructor() {
    super('User not found.')
  }
}
