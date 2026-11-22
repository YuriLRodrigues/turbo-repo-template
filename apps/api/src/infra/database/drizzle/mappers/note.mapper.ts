import { UniqueEntityId } from '@core/domain/unique-entity-id'
import { Note } from '@domain/notes/enterprise/entities/note.entity'
import { NoteTitle } from '@domain/notes/enterprise/value-objects/note-title'

import type { NewNoteRow, NoteRow } from '../schema/notes'

export class NoteMapper {
  static toDomain(row: NoteRow): Note {
    return Note.create(
      {
        ownerId: new UniqueEntityId(row.userId),
        // Validated by the domain before it was written.
        title: NoteTitle.restore(row.title),
        body: row.body,
        pinned: row.pinned,
        archivedAt: row.archivedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityId(row.id),
    )
  }

  static toPersistence(note: Note): NewNoteRow & { id: string } {
    return {
      id: note.id.toString(),
      userId: note.ownerId.toString(),
      title: note.title.value,
      body: note.body,
      pinned: note.pinned,
      archivedAt: note.archivedAt,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }
  }
}
