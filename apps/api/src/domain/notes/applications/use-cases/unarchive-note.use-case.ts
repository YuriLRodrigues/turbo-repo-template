import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import type { Note } from '../../enterprise/entities/note.entity'
import { canAccessNote } from '../../enterprise/policies/note-access.policy'
import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { NotesRepository } from '../repositories/notes.repository'

export type UnarchiveNoteInput = {
  actor: Actor
  noteId: string
}

export type UnarchiveNoteOutput = Either<NoteNotFoundError, { note: Note }>

/** Rule 2.2: the note goes back to the main list. Unarchiving a note that is not archived changes nothing. */
@Injectable()
export class UnarchiveNoteUseCase {
  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, noteId }: UnarchiveNoteInput): Promise<UnarchiveNoteOutput> {
    const note = await this.notesRepository.findById(noteId)
    if (!note || !canAccessNote(actor, note)) return left(new NoteNotFoundError())

    if (note.isArchived) {
      note.unarchive(this.clock.now())
      await this.notesRepository.save(note)
    }

    return right({ note })
  }
}
