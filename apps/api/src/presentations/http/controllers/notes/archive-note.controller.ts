import { Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { ArchiveNoteUseCase } from '@domain/notes/applications/use-cases/archive-note.use-case'
import { NoteNotFoundError } from '@domain/notes/errors/note-not-found.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { NoteResponseDto } from './dtos/note-response.dto'
import { NoteViewModel } from './view-models/note.view-model'

@ApiTags('notes')
@Controller('notes/:id/archive')
export class ArchiveNoteController {
  constructor(private readonly archiveNote: ArchiveNoteUseCase) {}

  @Patch()
  @ApiOperation({
    summary: 'Archive one of my notes',
    description:
      'Rule 2.2. It leaves the main list, is unpinned and becomes read-only. Archiving an archived note changes ' +
      'nothing.',
  })
  @ApiOkResponse({ type: NoteResponseDto })
  @ApiPrivate('bad-request', new NoteNotFoundError())
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<NoteResponseDto> {
    const result = await this.archiveNote.execute({ actor, noteId: id })

    if (result.isLeft()) throw result.value

    return NoteViewModel.toHttp(result.value.note)
  }
}
