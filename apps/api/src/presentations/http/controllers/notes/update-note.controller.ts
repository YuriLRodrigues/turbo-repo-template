import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { UpdateNoteUseCase } from '@domain/notes/applications/use-cases/update-note.use-case'
import { NoteArchivedError } from '@domain/notes/errors/note-archived.error'
import { NoteNotFoundError } from '@domain/notes/errors/note-not-found.error'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { UpdateNoteDto } from './dtos/note-request.dto'
import { NoteResponseDto } from './dtos/note-response.dto'
import { NOTE_FIELD_ERRORS } from './note-docs'
import { NoteViewModel } from './view-models/note.view-model'

@ApiTags('notes')
@Controller('notes/:id')
export class UpdateNoteController {
  constructor(private readonly updateNote: UpdateNoteUseCase) {}

  @Patch()
  @ApiOperation({
    summary: 'Change one of my notes',
    description:
      'Rules 2.1 to 2.3. Only what is sent changes; `body: null` clears the body. Either every change is saved or ' +
      'none is. An archived note answers 409 until it is unarchived.',
  })
  @ApiOkResponse({ type: NoteResponseDto })
  @ApiPrivate('validation', new NoteNotFoundError(), new NoteArchivedError(), ...NOTE_FIELD_ERRORS)
  async handle(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateNoteDto,
  ): Promise<NoteResponseDto> {
    const result = await this.updateNote.execute({ actor, noteId: id, ...body })

    if (result.isLeft()) throw result.value

    return NoteViewModel.toHttp(result.value.note)
  }
}
