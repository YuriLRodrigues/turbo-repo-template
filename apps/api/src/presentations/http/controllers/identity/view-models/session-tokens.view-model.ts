import type { SessionTokens } from '@domain/identity/applications/services/session-issuer'

import type { AuthTransport } from '../../../auth/refresh-transport'
import type { SessionTokensResponseDto } from '../dtos/session-tokens-response.dto'

/**
 * What sign-in and refresh answer. The refresh token is in the body only for the `token` transport; with the
 * cookie transport the controller has already put it in the httpOnly cookie, out of reach of the page's scripts.
 */
export class SessionTokensViewModel {
  static toHttp(tokens: SessionTokens, transport: AuthTransport, expiresIn: number): SessionTokensResponseDto {
    return {
      accessToken: tokens.accessToken,
      expiresIn,
      ...(transport === 'token' && { refreshToken: tokens.refreshToken }),
    }
  }
}
