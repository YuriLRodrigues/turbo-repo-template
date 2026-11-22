import { DomainError } from '@core/errors/domain-error'

/** Rule 1.7: a value the design system does not have (theme, accent, density). */
export class InvalidAppearanceError extends DomainError {
  readonly code = 'PREFERENCES.INVALID_APPEARANCE'
  readonly httpStatus = 422

  constructor(field: string, allowed: readonly unknown[]) {
    super(`The appearance option "${field}" is not valid.`, { field, allowed })
  }
}
