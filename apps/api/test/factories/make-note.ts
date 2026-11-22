import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { Note, type NoteProps } from '@domain/notes/enterprise/entities/note.entity'
import { NoteTitle } from '@domain/notes/enterprise/value-objects/note-title'

import { TEST_NOW } from '../time/fake-clock'

/** A valid note of a random owner, written at `TEST_NOW`. Override what the test is about. */
export function makeNote(override: Partial<NoteProps> = {}, id?: UniqueEntityId): Note {
  return Note.create(
    {
      ownerId: new UniqueEntityId(),
      title: NoteTitle.restore('Groceries'),
      body: null,
      pinned: false,
      archivedAt: null,
      createdAt: TEST_NOW,
      updatedAt: TEST_NOW,
      ...override,
    },
    id,
  )
}
