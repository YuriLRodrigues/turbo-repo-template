import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { ListSessionsUseCase } from '@domain/identity/applications/use-cases/list-sessions.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { CurrentSessionId } from '../../auth/current-session-id.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { PaginationQueryDto } from '../../pagination/pagination-query.dto'
import { SessionsPageResponseDto } from './dtos/session-response.dto'
import { SessionViewModel } from './view-models/session.view-model'

@ApiTags('me')
@Controller('me/sessions')
export class ListSessionsController {
  constructor(private readonly listSessions: ListSessionsUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Where I am signed in',
    description: 'The open sessions of the person, most recently used first. `current` marks the one of this request.',
  })
  @ApiOkResponse({ type: SessionsPageResponseDto })
  @ApiPrivate('validation')
  async handle(
    @CurrentActor() actor: Actor,
    @CurrentSessionId() currentSessionId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<SessionsPageResponseDto> {
    const result = await this.listSessions.execute({ actor, page: query.page, limit: query.limit })

    return SessionViewModel.toHttpPage(result.value.sessions, currentSessionId)
  }
}
