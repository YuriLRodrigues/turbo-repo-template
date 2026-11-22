import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { VerifyEmailUseCase } from '@domain/identity/applications/use-cases/verify-email.use-case'
import { VerificationTokenExpiredError } from '@domain/identity/errors/verification-token-expired.error'
import { VerificationTokenInvalidError } from '@domain/identity/errors/verification-token-invalid.error'

import { Public } from '../../auth/public.decorator'
import { ApiErrors } from '../../errors/api-errors.decorator'
import { VerifyEmailDto } from './dtos/account-link.dto'
import { UserResponseDto } from './dtos/user-response.dto'
import { UserViewModel } from './view-models/user.view-model'

@ApiTags('auth')
@Controller('auth/verify-email')
export class VerifyEmailController {
  constructor(private readonly verifyEmail: VerifyEmailUseCase) {}

  @Post()
  @Public()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Confirm the e-mail',
    description:
      'Rule 1.2. The page the e-mail link opens (`/verify-email?token=...` in the web app) sends the token here. ' +
      'The link works once and for 24 hours; a newer link replaces the older ones.',
  })
  @ApiOkResponse({ type: UserResponseDto, description: 'The account, now with `emailVerified: true`.' })
  @ApiErrors('validation', new VerificationTokenInvalidError(), new VerificationTokenExpiredError(), 'rate-limited')
  async handle(@Body() body: VerifyEmailDto): Promise<UserResponseDto> {
    const result = await this.verifyEmail.execute({ token: body.token })

    if (result.isLeft()) throw result.value

    return UserViewModel.toHttp(result.value.user)
  }
}
