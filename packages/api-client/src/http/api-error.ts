/** The one error shape of the API: `{ statusCode, code, message, details? }`. */
export type ApiErrorBody = {
  statusCode: number
  /** Stable and machine-readable (`NOTE.NOT_FOUND`). Branch on this, never on the message. */
  code: string
  /** Human-readable. This is what a toast shows. */
  message: string
  details?: Record<string, unknown>
}

export const isApiErrorBody = (value: unknown): value is ApiErrorBody =>
  typeof value === 'object' &&
  value !== null &&
  'statusCode' in value &&
  typeof value.statusCode === 'number' &&
  'code' in value &&
  typeof value.code === 'string' &&
  'message' in value &&
  typeof value.message === 'string'

/** For a failed response whose body is not the API's error shape (a proxy page, an empty body). */
export const toApiErrorBody = (status: number, body: unknown): ApiErrorBody =>
  isApiErrorBody(body)
    ? body
    : { statusCode: status, code: 'HTTP.UNEXPECTED_RESPONSE', message: 'The server returned an unexpected response.' }

/** Used when the API cannot be reached at all (down, wrong base URL, offline). */
export const API_UNREACHABLE: ApiErrorBody = {
  statusCode: 503,
  code: 'API.UNREACHABLE',
  message: 'The API is not reachable. Check your connection and try again.',
}

/** What `unwrap` throws, so TanStack Query gets a real `Error` that still carries the API's `code`. */
export class ApiError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly details?: Record<string, unknown>

  constructor(body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.code = body.code
    this.statusCode = body.statusCode
    this.details = body.details
  }
}

export const isApiError = (value: unknown): value is ApiError => value instanceof ApiError

/** Anything thrown while calling the API (a bug, an aborted request) as an `ApiError`. */
export const toApiError = (error: unknown): ApiError =>
  isApiError(error)
    ? error
    : new ApiError({ statusCode: 0, code: 'CLIENT.UNEXPECTED', message: 'Something went wrong. Try again.' })
