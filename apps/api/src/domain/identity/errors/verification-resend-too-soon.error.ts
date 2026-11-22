import { DomainError } from '@core/errors/domain-error'

/** Rule 1.2: the confirmation e-mail can be sent again once per minute. */
export class VerificationResendTooSoonError extends DomainError {
  readonly code = 'AUTH.VERIFICATION_RESEND_TOO_SOON'
  readonly httpStatus = 429

  constructor(retryAfterSeconds: number) {
    super('The confirmation e-mail was sent a moment ago. Wait before asking again.', { retryAfterSeconds })
  }
}
