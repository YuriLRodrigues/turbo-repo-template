import { Controller, Get, Query } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { ListNotesUseCase } from '@domain/notes/applications/use-cases/list-notes.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { ListNotesQueryDto } from './dtos/note-request.dto'
import { NotesPageResponseDto } from './dtos/note-response.dto'
import { NoteViewModel } from './view-models/note.view-model'

@ApiTags('notes')
@Controller('notes')
export class ListNotesController {
  constructor(private readonly listNotes: ListNotesUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'List my notes',
    description:
      'Rules 2.2 and 2.3. Pinned first, then the most recently changed. Archived notes are a list of their own ' +
      '(`archived=true`).',
  })
  @ApiOkResponse({ type: NotesPageResponseDto })
  @ApiPrivate('validation')
  async handle(@CurrentActor() actor: Actor, @Query() query: ListNotesQueryDto): Promise<NotesPageResponseDto> {
    const result = await this.listNotes.execute({ actor, ...query })

    return NoteViewModel.toHttpPage(result.value.notes)
  }
}
