import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { RequestPasswordResetUseCase } from '@domain/identity/applications/use-cases/request-password-reset.use-case'

import { Public } from '../../auth/public.decorator'
import { ApiErrors } from '../../errors/api-errors.decorator'
import { ForgotPasswordDto } from './dtos/account-link.dto'

@ApiTags('auth')
@Controller('auth/forgot-password')
export class RequestPasswordResetController {
  constructor(private readonly requestPasswordReset: RequestPasswordResetUseCase) {}

  @Post()
  @Public()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Ask for a link to choose a new password',
    description:
      'Rule 1.5. Always answers 204: "if the e-mail exists, we sent the link". The link is single use and valid ' +
      'for 1 hour. An address gets at most one e-mail per minute.',
  })
  @ApiNoContentResponse({ description: 'If the e-mail has an account, the link was sent.' })
  @ApiErrors('validation', 'rate-limited')
  async handle(@Body() body: ForgotPasswordDto): Promise<void> {
    await this.requestPasswordReset.execute({ email: body.email })
  }
}
