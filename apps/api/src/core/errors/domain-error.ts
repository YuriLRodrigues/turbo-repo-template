/**
 * Base of every business error. `code` is a stable contract for API clients (`NOTE.NOT_FOUND`): never reuse or
 * rename one. `httpStatus` is how the HTTP layer renders it; the domain never imports anything HTTP-specific.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string
  abstract readonly httpStatus: number
  readonly details?: Record<string, unknown>

  protected constructor(message: string, details?: Record<string, unknown>) {
    super(message)
    this.name = new.target.name
    this.details = details
  }
}
