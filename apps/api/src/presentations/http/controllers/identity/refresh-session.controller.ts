import { Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'

import { RefreshSessionUseCase } from '@domain/identity/applications/use-cases/refresh-session.use-case'
import { RefreshTokenExpiredError } from '@domain/identity/errors/refresh-token-expired.error'
import { RefreshTokenInvalidError } from '@domain/identity/errors/refresh-token-invalid.error'
import { RefreshTokenReusedError } from '@domain/identity/errors/refresh-token-reused.error'

import { CookieOriginGuard } from '../../auth/cookie-origin.guard'
import { Public } from '../../auth/public.decorator'
import { RefreshCookie, refreshTokenOf, transportOf, userAgentOf } from '../../auth/refresh-transport'
import { ApiErrors } from '../../errors/api-errors.decorator'
import { ApiRefreshTokenHeaders, REFRESH_COOKIE_HEADER } from './auth-docs'
import { SessionTokensResponseDto } from './dtos/session-tokens-response.dto'
import { SessionResponder } from './session-responder'

@ApiTags('auth')
@Controller('auth/refresh')
export class RefreshSessionController {
  constructor(
    private readonly refreshSession: RefreshSessionUseCase,
    private readonly sessionResponder: SessionResponder,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  @Post()
  @Public()
  @UseGuards(CookieOriginGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Renew the session',
    description:
      'Rule 1.3. Exchanges the refresh token for a new access token and a new refresh token. A refresh token works ' +
      'once: sending one that was already exchanged ends the whole session (`AUTH.REFRESH_TOKEN_REUSED`). Call it ' +
      'when a request answers 401, one refresh at a time, then repeat the request.',
  })
  @ApiRefreshTokenHeaders()
  @ApiOkResponse({ type: SessionTokensResponseDto, headers: REFRESH_COOKIE_HEADER })
  @ApiErrors(
    new RefreshTokenInvalidError(),
    new RefreshTokenExpiredError(),
    new RefreshTokenReusedError(),
    'forbidden',
    'rate-limited',
  )
  async handle(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionTokensResponseDto> {
    const result = await this.refreshSession.execute({
      refreshToken: refreshTokenOf(request),
      userAgent: userAgentOf(request),
    })

    if (result.isLeft()) {
      // The cookie is useless now: drop it, so the browser stops sending it.
      if (transportOf(request) === 'cookie') this.refreshCookie.clear(response)
      throw result.value
    }

    return this.sessionResponder.respond(request, response, result.value.tokens)
  }
}
