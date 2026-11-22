import { Injectable } from '@nestjs/common'

import type { Actor } from '@core/auth/actor'
import { type Either, right } from '@core/logic/either'
import type { Paginated, PaginationParams } from '@core/pagination/pagination'

import type { Note } from '../../enterprise/entities/note.entity'
import { NotesRepository } from '../repositories/notes.repository'

export type ListNotesInput = PaginationParams & {
  actor: Actor
  /** Rule 2.2: `true` lists the archive. */
  archived?: boolean
  search?: string
}

export type ListNotesOutput = Either<never, { notes: Paginated<Note> }>

/** Rules 2.2 and 2.3: the person's own notes, pinned first, then the most recently changed. */
@Injectable()
export class ListNotesUseCase {
  constructor(private readonly notesRepository: NotesRepository) {}

  async execute({ actor, page, limit, archived = false, search }: ListNotesInput): Promise<ListNotesOutput> {
    const notes = await this.notesRepository.findMany({
      ownerId: actor.id,
      archived,
      search: search?.trim() || undefined,
      page,
      limit,
    })

    return right({ notes })
  }
}
