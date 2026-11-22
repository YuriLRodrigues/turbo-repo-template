import { Controller, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Request, Response } from 'express'

import { SignOutUseCase } from '@domain/identity/applications/use-cases/sign-out.use-case'

import { CookieOriginGuard } from '../../auth/cookie-origin.guard'
import { Public } from '../../auth/public.decorator'
import { RefreshCookie, refreshTokenOf, transportOf } from '../../auth/refresh-transport'
import { ApiErrors } from '../../errors/api-errors.decorator'
import { ApiRefreshTokenHeaders } from './auth-docs'

@ApiTags('auth')
@Controller('auth/sign-out')
export class SignOutController {
  constructor(
    private readonly signOut: SignOutUseCase,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  @Post()
  @Public()
  @UseGuards(CookieOriginGuard)
  @HttpCode(204)
  @ApiOperation({
    summary: 'Sign out',
    description:
      'Rule 1.3. Ends the session of the refresh token and clears the cookie. It needs no access token and never ' +
      'fails: without a refresh token, or with one that is unknown or already ended, the answer is the same 204.',
  })
  @ApiRefreshTokenHeaders()
  @ApiNoContentResponse({ description: 'Signed out.' })
  @ApiErrors('forbidden', 'rate-limited')
  async handle(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    await this.signOut.execute({ refreshToken: refreshTokenOf(request) })

    if (transportOf(request) === 'cookie') this.refreshCookie.clear(response)
  }
}
