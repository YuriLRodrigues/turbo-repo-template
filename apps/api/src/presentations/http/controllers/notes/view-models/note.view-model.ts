import type { Paginated } from '@core/pagination/pagination'
import type { Note } from '@domain/notes/enterprise/entities/note.entity'

import type { NoteResponseDto, NotesPageResponseDto } from '../dtos/note-response.dto'

/** The HTTP shape of a note: the only way a `Note` becomes JSON. The owner is implicit (always the caller). */
export class NoteViewModel {
  static toHttp(note: Note): NoteResponseDto {
    return {
      id: note.id.toString(),
      title: note.title.value,
      body: note.body,
      pinned: note.pinned,
      archivedAt: note.archivedAt?.toISOString() ?? null,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    }
  }

  static toHttpPage({ results, meta }: Paginated<Note>): NotesPageResponseDto {
    return { results: results.map((note) => NoteViewModel.toHttp(note)), meta }
  }
}
