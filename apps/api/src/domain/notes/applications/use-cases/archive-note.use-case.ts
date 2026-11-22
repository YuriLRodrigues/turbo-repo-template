import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import type { Note } from '../../enterprise/entities/note.entity'
import { canAccessNote } from '../../enterprise/policies/note-access.policy'
import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { NotesRepository } from '../repositories/notes.repository'

export type ArchiveNoteInput = {
  actor: Actor
  noteId: string
}

export type ArchiveNoteOutput = Either<NoteNotFoundError, { note: Note }>

/** Rule 2.2: the note leaves the main list and becomes read-only. Archiving an archived note changes nothing. */
@Injectable()
export class ArchiveNoteUseCase {
  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, noteId }: ArchiveNoteInput): Promise<ArchiveNoteOutput> {
    const note = await this.notesRepository.findById(noteId)
    if (!note || !canAccessNote(actor, note)) return left(new NoteNotFoundError())

    if (!note.isArchived) {
      note.archive(this.clock.now())
      await this.notesRepository.save(note)
    }

    return right({ note })
  }
}
