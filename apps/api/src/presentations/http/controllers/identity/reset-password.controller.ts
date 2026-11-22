import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { ResetPasswordUseCase } from '@domain/identity/applications/use-cases/reset-password.use-case'
import { PASSWORD_MIN_LENGTH } from '@domain/identity/enterprise/identity-rules'
import { PasswordResetTokenExpiredError } from '@domain/identity/errors/password-reset-token-expired.error'
import { PasswordResetTokenInvalidError } from '@domain/identity/errors/password-reset-token-invalid.error'
import { WeakPasswordError } from '@domain/identity/errors/weak-password.error'

import { Public } from '../../auth/public.decorator'
import { ApiErrors } from '../../errors/api-errors.decorator'
import { ResetPasswordDto } from './dtos/account-link.dto'

@ApiTags('auth')
@Controller('auth/reset-password')
export class ResetPasswordController {
  constructor(private readonly resetPassword: ResetPasswordUseCase) {}

  @Post()
  @Public()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Choose a new password',
    description:
      'Rule 1.5. The page the e-mail link opens (`/reset-password?token=...` in the web app) sends the token and ' +
      'the new password here. Every session of the person ends: sign in again with the new password.',
  })
  @ApiNoContentResponse({ description: 'The password was changed and every session was ended.' })
  @ApiErrors(
    'validation',
    new PasswordResetTokenInvalidError(),
    new PasswordResetTokenExpiredError(),
    new WeakPasswordError(PASSWORD_MIN_LENGTH),
    'rate-limited',
  )
  async handle(@Body() body: ResetPasswordDto): Promise<void> {
    const result = await this.resetPassword.execute({ token: body.token, password: body.password })

    if (result.isLeft()) throw result.value
  }
}
