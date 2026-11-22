import { DomainError } from '@core/errors/domain-error'

/** Rule 0.2: the time zone must be an IANA name the server knows, such as `Europe/Lisbon`. */
export class InvalidTimeZoneError extends DomainError {
  readonly code = 'PREFERENCES.INVALID_TIME_ZONE'
  readonly httpStatus = 422

  constructor() {
    super('The time zone is not valid. Use an IANA name such as Europe/Lisbon.')
  }
}
