import { Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { UnarchiveNoteUseCase } from '@domain/notes/applications/use-cases/unarchive-note.use-case'
import { NoteNotFoundError } from '@domain/notes/errors/note-not-found.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { NoteResponseDto } from './dtos/note-response.dto'
import { NoteViewModel } from './view-models/note.view-model'

@ApiTags('notes')
@Controller('notes/:id/unarchive')
export class UnarchiveNoteController {
  constructor(private readonly unarchiveNote: UnarchiveNoteUseCase) {}

  @Patch()
  @ApiOperation({
    summary: 'Bring one of my notes back from the archive',
    description: 'Rule 2.2. Unarchiving a note that is not archived changes nothing.',
  })
  @ApiOkResponse({ type: NoteResponseDto })
  @ApiPrivate('bad-request', new NoteNotFoundError())
  async handle(@CurrentActor() actor: Actor, @Param('id', ParseUUIDPipe) id: string): Promise<NoteResponseDto> {
    const result = await this.unarchiveNote.execute({ actor, noteId: id })

    if (result.isLeft()) throw result.value

    return NoteViewModel.toHttp(result.value.note)
  }
}
