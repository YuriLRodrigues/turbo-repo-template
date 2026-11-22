import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'

import type { Note } from '../../enterprise/entities/note.entity'
import { canAccessNote } from '../../enterprise/policies/note-access.policy'
import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { NotesRepository } from '../repositories/notes.repository'

export type GetNoteInput = {
  actor: Actor
  noteId: string
}

export type GetNoteOutput = Either<NoteNotFoundError, { note: Note }>

/** Rule 0.4: someone else's note answers as if it did not exist. */
@Injectable()
export class GetNoteUseCase {
  constructor(private readonly notesRepository: NotesRepository) {}

  async execute({ actor, noteId }: GetNoteInput): Promise<GetNoteOutput> {
    const note = await this.notesRepository.findById(noteId)
    if (!note || !canAccessNote(actor, note)) return left(new NoteNotFoundError())

    return right({ note })
  }
}
