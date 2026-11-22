import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { type Either, left, right } from '@core/logic/either'
import { Clock } from '@core/time/clock'

import { Note } from '../../enterprise/entities/note.entity'
import { parseNoteBody } from '../../enterprise/policies/note-body.policy'
import { NoteTitle } from '../../enterprise/value-objects/note-title'
import type { InvalidNoteBodyError } from '../../errors/invalid-note-body.error'
import type { InvalidNoteTitleError } from '../../errors/invalid-note-title.error'
import { NotesRepository } from '../repositories/notes.repository'

export type CreateNoteInput = {
  actor: Actor
  title: string
  body?: string | null
  pinned?: boolean
}

export type CreateNoteOutput = Either<InvalidNoteTitleError | InvalidNoteBodyError, { note: Note }>

/** Rule 2.1: a note has a title and, optionally, a body. It belongs to whoever writes it. */
@Injectable()
export class CreateNoteUseCase {
  constructor(
    private readonly notesRepository: NotesRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ actor, title, body, pinned = false }: CreateNoteInput): Promise<CreateNoteOutput> {
    const titleOrError = NoteTitle.create(title)
    if (titleOrError.isLeft()) return left(titleOrError.value)

    const bodyOrError = parseNoteBody(body)
    if (bodyOrError.isLeft()) return left(bodyOrError.value)

    const now = this.clock.now()
    const note = Note.write({
      ownerId: new UniqueEntityId(actor.id),
      title: titleOrError.value,
      body: bodyOrError.value,
      now,
    })
    note.setPinned(pinned, now)

    await this.notesRepository.create(note)

    return right({ note })
  }
}
