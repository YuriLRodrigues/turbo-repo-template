import { Injectable } from '@nestjs/common'
import { and, asc, count, desc, eq, ilike, isNotNull, isNull, or } from 'drizzle-orm'

import { DomainEvents } from '@core/events/domain-events'
import { offsetOf, type Paginated, paginated } from '@core/pagination/pagination'
import type { FindManyNotesParams, NotesRepository } from '@domain/notes/applications/repositories/notes.repository'
import type { Note } from '@domain/notes/enterprise/entities/note.entity'

import { DrizzleService } from '../drizzle.service'
import { containsPattern } from '../like-pattern'
import { NoteMapper } from '../mappers/note.mapper'
import { notes } from '../schema/notes'

@Injectable()
export class DrizzleNotesRepository implements NotesRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findById(id: string): Promise<Note | null> {
    const [row] = await this.drizzle.db.select().from(notes).where(eq(notes.id, id)).limit(1)

    return row ? NoteMapper.toDomain(row) : null
  }

  async findMany({ ownerId, archived, search, ...params }: FindManyNotesParams): Promise<Paginated<Note>> {
    const pattern = search ? containsPattern(search) : undefined
    const where = and(
      eq(notes.userId, ownerId),
      archived ? isNotNull(notes.archivedAt) : isNull(notes.archivedAt),
      pattern ? or(ilike(notes.title, pattern), ilike(notes.body, pattern)) : undefined,
    )

    const [rows, [{ total }]] = await Promise.all([
      this.drizzle.db
        .select()
        .from(notes)
        .where(where)
        .orderBy(desc(notes.pinned), desc(notes.updatedAt), desc(notes.id))
        .limit(params.limit)
        .offset(offsetOf(params)),
      this.drizzle.db.select({ total: count() }).from(notes).where(where),
    ])

    return paginated(
      rows.map((row) => NoteMapper.toDomain(row)),
      total,
      params,
    )
  }

  async findAllOfUser(userId: string): Promise<Note[]> {
    const rows = await this.drizzle.db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(asc(notes.createdAt), asc(notes.id))

    return rows.map((row) => NoteMapper.toDomain(row))
  }

  async create(note: Note): Promise<void> {
    await this.drizzle.db.insert(notes).values(NoteMapper.toPersistence(note))
    await DomainEvents.dispatchEventsForAggregate(note.id)
  }

  async save(note: Note): Promise<void> {
    const { id, ...changes } = NoteMapper.toPersistence(note)

    await this.drizzle.db.update(notes).set(changes).where(eq(notes.id, id))
    await DomainEvents.dispatchEventsForAggregate(note.id)
  }

  async delete(note: Note): Promise<void> {
    await this.drizzle.db.delete(notes).where(eq(notes.id, note.id.toString()))
    await DomainEvents.dispatchEventsForAggregate(note.id)
  }

  async deleteAllOfUser(userId: string): Promise<void> {
    await this.drizzle.db.delete(notes).where(eq(notes.userId, userId))
  }
}
