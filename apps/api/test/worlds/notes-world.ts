import type { Actor } from '@core/auth/actor'
import { UniqueEntityId } from '@core/domain/unique-entity-id'
import type { NoteProps } from '@domain/notes/enterprise/entities/note.entity'

import { makeNote } from '../factories/make-note'
import { makeActor } from '../factories/make-user'
import { InMemoryNotesRepository } from '../repositories/in-memory-notes.repository'
import { FakeClock } from '../time/fake-clock'

/**
 * Everything a notes use case can ask for, in memory, plus two people: `owner` and `stranger`. A spec builds one
 * per test and passes the pieces its use case needs to the constructor.
 */
export function makeNotesWorld() {
  const clock = new FakeClock()
  const notesRepository = new InMemoryNotesRepository()
  const owner: Actor = makeActor()
  const stranger: Actor = makeActor()

  /** A note of `owner` (or of whoever `ownerId` says), already stored. */
  const storedNote = (override: Partial<NoteProps> = {}) => {
    const note = makeNote({ ownerId: new UniqueEntityId(owner.id), ...override })
    notesRepository.items.push(note)

    return note
  }

  return { clock, notesRepository, owner, stranger, storedNote }
}

export type NotesWorld = ReturnType<typeof makeNotesWorld>
