import { Body, Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'

import { AuthenticateUserUseCase } from '@domain/identity/applications/use-cases/authenticate-user.use-case'
import { InvalidCredentialsError } from '@domain/identity/errors/invalid-credentials.error'
import { TooManyAttemptsError } from '@domain/identity/errors/too-many-attempts.error'

import { CookieOriginGuard } from '../../auth/cookie-origin.guard'
import { Public } from '../../auth/public.decorator'
import { userAgentOf } from '../../auth/refresh-transport'
import { ApiErrors } from '../../errors/api-errors.decorator'
import { ApiAuthTransportHeader, REFRESH_COOKIE_HEADER } from './auth-docs'
import { SessionTokensResponseDto } from './dtos/session-tokens-response.dto'
import { SignInDto } from './dtos/sign-in.dto'
import { SessionResponder } from './session-responder'

@ApiTags('auth')
@Controller('auth/sign-in')
export class SignInController {
  constructor(
    private readonly authenticateUser: AuthenticateUserUseCase,
    private readonly sessionResponder: SessionResponder,
  ) {}

  @Post()
  @Public()
  @UseGuards(CookieOriginGuard)
  @HttpCode(200)
  @ApiOperation({
    summary: 'Sign in',
    description:
      'Rules 1.3 and 1.4. Answers a short access token (15 minutes) and starts a session with a rotating refresh ' +
      'token (30 days). On the web the refresh token is set as an httpOnly cookie; a native app sends ' +
      '`x-auth-transport: token` and receives it in the body. A wrong password and an e-mail without an account ' +
      'get the same answer. Five wrong passwords for an e-mail in 15 minutes block it for 15 minutes.',
  })
  @ApiAuthTransportHeader()
  @ApiOkResponse({ type: SessionTokensResponseDto, headers: REFRESH_COOKIE_HEADER })
  @ApiErrors('validation', new InvalidCredentialsError(), 'forbidden', new TooManyAttemptsError(840), 'rate-limited')
  async handle(
    @Body() body: SignInDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionTokensResponseDto> {
    const result = await this.authenticateUser.execute({ ...body, userAgent: userAgentOf(request) })

    if (result.isLeft()) throw result.value

    return this.sessionResponder.respond(request, response, result.value.tokens)
  }
}
