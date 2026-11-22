import { AggregateRoot } from '@core/domain/aggregate-root'
import type { UniqueEntityId } from '@core/domain/unique-entity-id'

import { NoteArchivedEvent } from '../events/note-archived.event'
import type { NoteTitle } from '../value-objects/note-title'

export type NoteProps = {
  ownerId: UniqueEntityId
  title: NoteTitle
  /** Free text, line breaks kept. `null` when the note is only a title. */
  body: string | null
  /** Rule 2.3: pinned notes come first in the list. */
  pinned: boolean
  /** Rule 2.2: set while the note is archived. */
  archivedAt: Date | null
  createdAt: Date
  /** The last change; equal to `createdAt` until something changes. */
  updatedAt: Date
}

/**
 * The aggregate of the example context. Its state changes only through the methods below, which say what happens
 * and take "now" from the caller (the use case asks the injected `Clock`): the entity never reads the time itself.
 */
export class Note extends AggregateRoot<NoteProps> {
  get ownerId(): UniqueEntityId {
    return this.props.ownerId
  }

  get title(): NoteTitle {
    return this.props.title
  }

  get body(): string | null {
    return this.props.body
  }

  get pinned(): boolean {
    return this.props.pinned
  }

  get archivedAt(): Date | null {
    return this.props.archivedAt
  }

  get isArchived(): boolean {
    return this.props.archivedAt !== null
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  rename(title: NoteTitle, now: Date): void {
    this.props.title = title
    this.props.updatedAt = now
  }

  rewrite(body: string | null, now: Date): void {
    this.props.body = body
    this.props.updatedAt = now
  }

  /** Rule 2.3. Pinning a pinned note changes nothing. */
  setPinned(pinned: boolean, now: Date): void {
    if (this.props.pinned === pinned) return
    this.props.pinned = pinned
    this.props.updatedAt = now
  }

  /**
   * Rule 2.2: the note leaves the main list, is unpinned and becomes read-only. Raises `NoteArchivedEvent`.
   * Archiving an archived note changes nothing and raises nothing.
   */
  archive(now: Date): void {
    if (this.isArchived) return
    this.props.archivedAt = now
    this.props.pinned = false
    this.props.updatedAt = now
    this.addDomainEvent(new NoteArchivedEvent(this, now))
  }

  /** Rule 2.2. Unarchiving a note that is not archived changes nothing. */
  unarchive(now: Date): void {
    if (!this.isArchived) return
    this.props.archivedAt = null
    this.props.updatedAt = now
  }

  /** A new note: not pinned, not archived. */
  static write(input: { ownerId: UniqueEntityId; title: NoteTitle; body: string | null; now: Date }): Note {
    return new Note({
      ownerId: input.ownerId,
      title: input.title,
      body: input.body,
      pinned: false,
      archivedAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    })
  }

  /** Rebuilds a note that already exists (mappers, factories). */
  static create(props: NoteProps, id?: UniqueEntityId): Note {
    return new Note(props, id)
  }
}
