import { DomainError } from '@core/errors/domain-error'

/**
 * The signed-in person was asked for their current password and typed a wrong one. Not a 401: the access token is
 * fine, and a client that renews the session on every 401 must not do it here.
 */
export class WrongPasswordError extends DomainError {
  readonly code = 'USER.WRONG_PASSWORD'
  readonly httpStatus = 422

  constructor() {
    super('The password is incorrect.')
  }
}
