import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { GetNoteUseCase } from '@domain/notes/applications/use-cases/get-note.use-case'
import { NoteNotFoundError } from '@domain/notes/errors/note-not-found.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { NoteResponseDto } from './dtos/note-response.dto'
import { NoteViewModel } from './view-models/note.view-model'

@ApiTags('notes')
@Controller('notes/:id')
export class GetNoteController {
  constructor(private readonly getNote: GetNoteUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Read one of my notes', description: "Rule 0.4: someone else's note answers 404." })
  @ApiOkResponse({ type: NoteResponseDto })
  @ApiPrivate('bad-request', new NoteNotFoundError())
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<NoteResponseDto> {
    const result = await this.getNote.execute({ actor, noteId: id })

    if (result.isLeft()) throw result.value

    return NoteViewModel.toHttp(result.value.note)
  }
}
