import { Controller, Delete, HttpCode, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { DeleteNoteUseCase } from '@domain/notes/applications/use-cases/delete-note.use-case'
import { NoteNotFoundError } from '@domain/notes/errors/note-not-found.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'

@ApiTags('notes')
@Controller('notes/:id')
export class DeleteNoteController {
  constructor(private readonly deleteNote: DeleteNoteUseCase) {}

  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete one of my notes', description: 'Rule 2.4. For good, archived or not.' })
  @ApiNoContentResponse({ description: 'The note was deleted.' })
  @ApiPrivate('bad-request', new NoteNotFoundError())
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const result = await this.deleteNote.execute({ actor, noteId: id })

    if (result.isLeft()) throw result.value
  }
}
