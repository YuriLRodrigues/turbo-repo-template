import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'

import { canAccessNote } from '../../enterprise/policies/note-access.policy'
import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { NotesRepository } from '../repositories/notes.repository'

export type DeleteNoteInput = {
  actor: Actor
  noteId: string
}

export type DeleteNoteOutput = Either<NoteNotFoundError, null>

/** Rule 2.4: deleting is for good, archived or not. */
@Injectable()
export class DeleteNoteUseCase {
  constructor(private readonly notesRepository: NotesRepository) {}

  async execute({ actor, noteId }: DeleteNoteInput): Promise<DeleteNoteOutput> {
    const note = await this.notesRepository.findById(noteId)
    if (!note || !canAccessNote(actor, note)) return left(new NoteNotFoundError())

    await this.notesRepository.delete(note)

    return right(null)
  }
}
