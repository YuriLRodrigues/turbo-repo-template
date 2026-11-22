import type { Paginated, PaginationParams } from '@core/pagination/pagination'

import type { Note } from '../../enterprise/entities/note.entity'

export type FindManyNotesParams = PaginationParams & {
  ownerId: string
  /** Rule 2.2: the main list has the notes that are not archived; `true` lists the archive instead. */
  archived: boolean
  /** Case-insensitive match on the title or the body. */
  search?: string
}

/** `create`, `save` and `delete` dispatch the aggregate's domain events after the write succeeds. */
export abstract class NotesRepository {
  abstract findById(id: string): Promise<Note | null>
  /** Rule 2.3: pinned first, then the most recently changed. */
  abstract findMany(params: FindManyNotesParams): Promise<Paginated<Note>>
  /** Rule 1.6: everything, oldest first, for the export. */
  abstract findAllOfUser(userId: string): Promise<Note[]>
  abstract create(note: Note): Promise<void>
  abstract save(note: Note): Promise<void>
  abstract delete(note: Note): Promise<void>
  /** Rule 1.6. */
  abstract deleteAllOfUser(userId: string): Promise<void>
}
