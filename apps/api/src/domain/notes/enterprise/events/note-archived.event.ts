import type { UniqueEntityId } from '@core/domain/unique-entity-id'
import type { DomainEvent } from '@core/events/domain-event'

import type { Note } from '../entities/note.entity'

/** Raised by `Note.archive` and dispatched by the repository once the archived note is saved. */
export class NoteArchivedEvent implements DomainEvent {
  constructor(
    readonly note: Note,
    readonly occurredAt: Date,
  ) {}

  getAggregateId(): UniqueEntityId {
    return this.note.id
  }
}
