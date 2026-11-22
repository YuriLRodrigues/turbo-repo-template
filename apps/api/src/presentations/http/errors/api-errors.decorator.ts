import { applyDecorators } from '@nestjs/common'
import { ApiBearerAuth, ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

import type { DomainError } from '@core/errors/domain-error'

import { ErrorResponseDto } from './error-response.dto'

/** The errors that do not come from a use case: the filter gives them these codes (`http-error.filter.ts`). */
const TRANSPORT_ERRORS = {
  validation: {
    statusCode: 400,
    code: 'VALIDATION.FAILED',
    message: 'Request validation failed.',
    details: { errors: ['property admin should not exist'] },
  },
  'bad-request': { statusCode: 400, code: 'HTTP.BAD_REQUEST', message: 'Validation failed (uuid is expected)' },
  unauthorized: { statusCode: 401, code: 'HTTP.UNAUTHORIZED', message: 'Unauthorized' },
  forbidden: { statusCode: 403, code: 'HTTP.FORBIDDEN', message: 'Forbidden resource' },
  'rate-limited': {
    statusCode: 429,
    code: 'HTTP.TOO_MANY_REQUESTS',
    message: 'ThrottlerException: Too Many Requests',
  },
} satisfies Record<string, ErrorResponseDto>

export type TransportError = keyof typeof TRANSPORT_ERRORS

const toBody = (error: DomainError | TransportError): ErrorResponseDto =>
  typeof error === 'string'
    ? TRANSPORT_ERRORS[error]
    : {
        statusCode: error.httpStatus,
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
      }

/**
 * Documents every error a route can answer, one example per code. OpenAPI keys responses by status, so codes that
 * share a status become named examples of the same response.
 *
 * Pass the errors themselves: `@ApiErrors('validation', new AccountNotFoundError())`. The examples are then the
 * bodies the API really sends, and cannot drift from the domain.
 */
export function ApiErrors(...errors: (DomainError | TransportError)[]): MethodDecorator & ClassDecorator {
  const byStatus = new Map<number, ErrorResponseDto[]>()
  for (const body of errors.map(toBody)) {
    byStatus.set(body.statusCode, [...(byStatus.get(body.statusCode) ?? []), body])
  }

  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ...[...byStatus].map(([status, bodies]) =>
      ApiResponse({
        status,
        description: bodies.map((body) => `\`${body.code}\``).join(' or '),
        content: {
          'application/json': {
            schema: { $ref: getSchemaPath(ErrorResponseDto) },
            examples: Object.fromEntries(bodies.map((body) => [body.code, { value: body }])),
          },
        },
      }),
    ),
  )
}

/** A route that needs the access token: the padlock in Swagger, the 401, and whatever else it can answer. */
export function ApiPrivate(...errors: (DomainError | TransportError)[]): MethodDecorator & ClassDecorator {
  return applyDecorators(ApiBearerAuth(), ApiErrors('unauthorized', ...errors))
}
