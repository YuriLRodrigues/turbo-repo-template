import { Controller, Delete, HttpCode, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { RevokeSessionUseCase } from '@domain/identity/applications/use-cases/revoke-session.use-case'
import { SessionNotFoundError } from '@domain/identity/errors/session-not-found.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'

@ApiTags('me')
@Controller('me/sessions/:id')
export class RevokeSessionController {
  constructor(private readonly revokeSession: RevokeSessionUseCase) {}

  @Delete()
  @HttpCode(204)
  @ApiOperation({
    summary: 'End one of my sessions',
    description:
      'That device cannot renew its access any more; the access token it already holds stops working when it ' +
      'expires (up to 15 minutes). Ending the current session is the same as signing out.',
  })
  @ApiNoContentResponse({ description: 'The session was ended.' })
  @ApiPrivate('bad-request', new SessionNotFoundError())
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.revokeSession.execute({ actor, sessionId: id })

    if (result.isLeft()) throw result.value
  }
}
