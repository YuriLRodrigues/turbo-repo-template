import { Body, Controller, Post } from '@nestjs/common'
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import type { Actor } from '@core/auth/actor'
import { CreateNoteUseCase } from '@domain/notes/applications/use-cases/create-note.use-case'

import { CurrentActor } from '../../auth/current-actor.decorator'
import { ApiPrivate } from '../../errors/api-errors.decorator'
import { CreateNoteDto } from './dtos/note-request.dto'
import { NoteResponseDto } from './dtos/note-response.dto'
import { NOTE_FIELD_ERRORS } from './note-docs'
import { NoteViewModel } from './view-models/note.view-model'

@ApiTags('notes')
@Controller('notes')
export class CreateNoteController {
  constructor(private readonly createNote: CreateNoteUseCase) {}

  @Post()
  @ApiOperation({
    summary: 'Write a note',
    description: 'Rule 2.1. A title of up to 120 characters and, optionally, a body of up to 10 000.',
  })
  @ApiCreatedResponse({ type: NoteResponseDto })
  @ApiPrivate('validation', ...NOTE_FIELD_ERRORS)
  async handle(@CurrentActor() actor: Actor, @Body() body: CreateNoteDto): Promise<NoteResponseDto> {
    const result = await this.createNote.execute({ actor, ...body })

    if (result.isLeft()) throw result.value

    return NoteViewModel.toHttp(result.value.note)
  }
}
