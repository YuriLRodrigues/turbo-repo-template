import { DomainEvents } from '@core/events/domain-events'
import { offsetOf, type Paginated, paginated } from '@core/pagination/pagination'
import type { FindManyNotesParams, NotesRepository } from '@domain/notes/applications/repositories/notes.repository'
import type { Note } from '@domain/notes/enterprise/entities/note.entity'

/** Same contract as the Drizzle repository, including the order of each list and the event dispatch. */
export class InMemoryNotesRepository implements NotesRepository {
  items: Note[] = []

  async findById(id: string): Promise<Note | null> {
    return this.items.find((note) => note.id.toString() === id) ?? null
  }

  async findMany(params: FindManyNotesParams): Promise<Paginated<Note>> {
    // `ilike` in Postgres: case-insensitive, on the title or on the body.
    const term = params.search?.toLowerCase()
    const contains = (text: string | null) => text !== null && text.toLowerCase().includes(term ?? '')
    const matching = this.ofUser(params.ownerId)
      .filter((note) => note.isArchived === params.archived)
      .filter((note) => !term || contains(note.title.value) || contains(note.body))
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          b.updatedAt.getTime() - a.updatedAt.getTime() ||
          b.id.toString().localeCompare(a.id.toString()),
      )
    const offset = offsetOf(params)

    return paginated(matching.slice(offset, offset + params.limit), matching.length, params)
  }

  async findAllOfUser(userId: string): Promise<Note[]> {
    return this.ofUser(userId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async create(note: Note): Promise<void> {
    this.items.push(note)
    await DomainEvents.dispatchEventsForAggregate(note.id)
  }

  async save(note: Note): Promise<void> {
    this.items = this.items.map((current) => (current.id.equals(note.id) ? note : current))
    await DomainEvents.dispatchEventsForAggregate(note.id)
  }

  async delete(note: Note): Promise<void> {
    this.items = this.items.filter((current) => !current.id.equals(note.id))
    await DomainEvents.dispatchEventsForAggregate(note.id)
  }

  async deleteAllOfUser(userId: string): Promise<void> {
    this.items = this.items.filter((note) => note.ownerId.toString() !== userId)
  }

  private ofUser(userId: string): Note[] {
    return this.items.filter((note) => note.ownerId.toString() === userId)
  }
}
