import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common'
import type { Response } from 'express'

import { DomainError } from '@core/errors/domain-error'
import { isMissingUserViolation } from '@infra/database/drizzle/database-errors'

import type { ErrorResponseDto } from './error-response.dto'

/**
 * Renders every error as `{ statusCode, code, message, details? }`:
 * - `DomainError` → its own code and status (and a `Retry-After` header when it says how long to wait);
 * - validation errors (ValidationPipe) → 400 `VALIDATION.FAILED` with the messages in `details.errors`;
 * - other `HttpException`s → `HTTP.<STATUS_NAME>` (e.g. `HTTP.UNAUTHORIZED`);
 * - a write for an account that was deleted while its access token was still valid → 401 `HTTP.UNAUTHORIZED`;
 * - anything else → 500 `INTERNAL.UNEXPECTED`, logged with its stack and never echoed to the client.
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const body = this.toBody(exception)
    const response = host.switchToHttp().getResponse<Response>()
    // Read by the request log, so the line of a failed request says which error it was.
    response.locals.errorCode = body.code

    const retryAfter = body.details?.retryAfterSeconds
    if (typeof retryAfter === 'number') response.setHeader('Retry-After', String(retryAfter))

    response.status(body.statusCode).json(body)
  }

  private toBody(exception: unknown): ErrorResponseDto {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.httpStatus,
        code: exception.code,
        message: exception.message,
        ...(exception.details && { details: exception.details }),
      }
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const response = exception.getResponse()
      const messages = typeof response === 'object' && 'message' in response ? response.message : undefined

      if (Array.isArray(messages)) {
        return {
          statusCode,
          code: 'VALIDATION.FAILED',
          message: 'Request validation failed.',
          details: { errors: messages },
        }
      }

      return { statusCode, code: `HTTP.${HttpStatus[statusCode] ?? 'ERROR'}`, message: exception.message }
    }

    // The access token outlives the account by up to 15 minutes: the database is what notices the person is gone.
    if (isMissingUserViolation(exception)) {
      return { statusCode: 401, code: 'HTTP.UNAUTHORIZED', message: 'Unauthorized' }
    }

    // The logger turns an `Error` into a block with its stack (pretty) or into a `stack` field (json).
    this.logger.error(exception instanceof Error ? exception : String(exception))

    return { statusCode: 500, code: 'INTERNAL.UNEXPECTED', message: 'Something went wrong.' }
  }
}
