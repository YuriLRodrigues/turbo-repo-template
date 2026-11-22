import { DomainError } from '@core/errors/domain-error'

/** Rule 1.8: the state of the welcome steps makes no sense (unknown step, a step both done and skipped). */
export class InvalidOnboardingError extends DomainError {
  readonly code = 'PREFERENCES.INVALID_ONBOARDING'
  readonly httpStatus = 422

  constructor(reason: string) {
    super(`The onboarding state is not valid: ${reason}.`, { reason })
  }
}
