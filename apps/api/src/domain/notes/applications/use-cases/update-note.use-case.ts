import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, left, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import type { Note } from '../../enterprise/entities/note.entity'
import { canAccessNote } from '../../enterprise/policies/note-access.policy'
import { parseNoteBody } from '../../enterprise/policies/note-body.policy'
import { NoteTitle } from '../../enterprise/value-objects/note-title'
import type { InvalidNoteBodyError } from '../../errors/invalid-note-body.error'
import type { InvalidNoteTitleError } from '../../errors/invalid-note-title.error'
import { NoteArchivedError } from '../../errors/note-archived.error'
import { NoteNotFoundError } from '../../errors/note-not-found.error'
import { NotesRepository } from '../repositories/notes.repository'

export type UpdateNoteInput = {
  actor: Actor
  noteId: string
  /** Absent keeps the current title. */
  title?: string
  /** Absent keeps the current body; `null` or blank clears it. */
  body?: string | null
  /** Absent keeps it as it is. */
  pinned?: boolean
}

export type UpdateNoteOutput = Either<
  NoteNotFoundError | NoteArchivedError | InvalidNoteTitleError | InvalidNoteBodyError,
  { note: Note }
>

/** Rules 2.1 to 2.3. Every field is validated before anything changes: either all of it is saved or nothing is. */
@Injectable()
export class UpdateNoteUseCase {
  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, noteId, title, body, pinned }: UpdateNoteInput): Promise<UpdateNoteOutput> {
    const note = await this.notesRepository.findById(noteId)
    if (!note || !canAccessNote(actor, note)) return left(new NoteNotFoundError())
    if (note.isArchived) return left(new NoteArchivedError())

    let newTitle: NoteTitle | undefined
    if (title !== undefined) {
      const titleOrError = NoteTitle.create(title)
      if (titleOrError.isLeft()) return left(titleOrError.value)
      newTitle = titleOrError.value
    }

    let newBody: { value: string | null } | undefined
    if (body !== undefined) {
      const bodyOrError = parseNoteBody(body)
      if (bodyOrError.isLeft()) return left(bodyOrError.value)
      newBody = { value: bodyOrError.value }
    }

    const now = this.clock.now()
    if (newTitle) note.rename(newTitle, now)
    if (newBody) note.rewrite(newBody.value, now)
    if (pinned !== undefined) note.setPinned(pinned, now)

    await this.notesRepository.save(note)

    return right({ note })
  }
}
