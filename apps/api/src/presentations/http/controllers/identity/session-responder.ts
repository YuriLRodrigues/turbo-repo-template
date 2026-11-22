import { Injectable } from '@nestjs/common'
import type { Request, Response } from 'express'

import type { SessionTokens } from '@domain/identity/applications/services/session-issuer'
import { EnvService } from '@infra/env/env.service'

import { RefreshCookie, transportOf } from '../../auth/refresh-transport'
import type { SessionTokensResponseDto } from './dtos/session-tokens-response.dto'
import { SessionTokensViewModel } from './view-models/session-tokens.view-model'

/**
 * Hands a new pair of tokens to the client the way its transport asks: sets the refresh cookie (web) or leaves the
 * refresh token in the body (native). Shared by the sign-in and refresh controllers.
 */
@Injectable()
export class SessionResponder {
  private readonly accessTokenTtlSeconds: number

  constructor(
    private readonly refreshCookie: RefreshCookie,
    env: EnvService,
  ) {
    this.accessTokenTtlSeconds = env.get('JWT_EXPIRES_IN_SECONDS')
  }

  respond(request: Request, response: Response, tokens: SessionTokens): SessionTokensResponseDto {
    const transport = transportOf(request)
    if (transport === 'cookie') this.refreshCookie.set(response, tokens.refreshToken, tokens.refreshTokenExpiresAt)

    return SessionTokensViewModel.toHttp(tokens, transport, this.accessTokenTtlSeconds)
  }
}
