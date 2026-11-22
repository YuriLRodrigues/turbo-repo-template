import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'

import type { Actor } from '@core/auth/actor'
import { DeleteUserAccountUseCase } from '@domain/identity/applications/use-cases/delete-user-account.use-case'
import { UserNotFoundError } from '@domain/identity/errors/user-not-found.error'
import { WrongPasswordError } from '@domain/identity/errors/wrong-password.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { RefreshCookie } from '../../auth/refresh-transport'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { DeleteUserAccountDto } from './dtos/account-link.dto'

@ApiTags('me')
@Controller('me/delete')
export class DeleteUserAccountController {
  constructor(
    private readonly deleteUserAccount: DeleteUserAccountUseCase,
    private readonly refreshCookie: RefreshCookie,
  ) {}

  /** A POST with a body, not a DELETE: the password travels in the body, and proxies may drop the body of a DELETE. */
  @Post()
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete my account',
    description:
      'Rule 1.6. Deletes the account and everything that belongs to it (notes, preferences, sessions and the data ' +
      'of every other context). It cannot be undone, so the current password is asked again.',
  })
  @ApiNoContentResponse({ description: 'The account and all its data were deleted.' })
  @ApiPrivate('validation', new UserNotFoundError(), new WrongPasswordError())
  async handle(
    @CurrentActor() actor: Actor,
    @Body() body: DeleteUserAccountDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const result = await this.deleteUserAccount.execute({ actor, password: body.password })

    if (result.isLeft()) throw result.value

    this.refreshCookie.clear(response)
  }
}
