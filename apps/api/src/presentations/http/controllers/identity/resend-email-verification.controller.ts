import { Controller, HttpCode, Post } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { ResendEmailVerificationUseCase } from '@domain/identity/applications/use-cases/resend-email-verification.use-case'
import { EmailAlreadyVerifiedError } from '@domain/identity/errors/email-already-verified.error'
import { UserNotFoundError } from '@domain/identity/errors/user-not-found.error'
import { VerificationResendTooSoonError } from '@domain/identity/errors/verification-resend-too-soon.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'

@ApiTags('auth')
@Controller('auth/verify-email/resend')
export class ResendEmailVerificationController {
  constructor(private readonly resendEmailVerification: ResendEmailVerificationUseCase) {}

  @Post()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Send the confirmation e-mail again',
    description: 'Rule 1.2. For the signed-in person, at most once per minute. The new link replaces the previous one.',
  })
  @ApiNoContentResponse({ description: 'The e-mail is on its way.' })
  @ApiPrivate(new UserNotFoundError(), new EmailAlreadyVerifiedError(), new VerificationResendTooSoonError(40))
  async handle(@CurrentActor() actor: Actor): Promise<void> {
    const result = await this.resendEmailVerification.execute({ actor })

    if (result.isLeft()) throw result.value
  }
}
