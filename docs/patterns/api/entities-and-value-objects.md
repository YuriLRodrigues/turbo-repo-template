# Entities and value objects

## Entity / aggregate root

```ts
export type NoteProps = {
  ownerId: UniqueEntityId
  title: NoteTitle
  body: string | null
  pinned: boolean
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class Note extends AggregateRoot<NoteProps> {
  get title(): NoteTitle {
    return this.props.title
  }

  rename(title: NoteTitle, now: Date): void {
    this.props.title = title
    this.props.updatedAt = now
  }

  archive(now: Date): void {
    if (this.isArchived) return
    this.props.archivedAt = now
    this.props.pinned = false
    this.props.updatedAt = now
    this.addDomainEvent(new NoteArchivedEvent(this, now))
  }

  /** A new note: not pinned, not archived. */
  static write(input: { ownerId: UniqueEntityId; title: NoteTitle; body: string | null; now: Date }): Note { ... }

  /** Rebuilds a note that already exists (mappers, factories). */
  static create(props: NoteProps, id?: UniqueEntityId): Note { ... }
}
```

- Props are a `type`, private to the entity, exposed through getters.
- Changes happen through **intention-revealing methods** (`rename`, `archive`, `setPinned`), never setters. A method
  that would change nothing says so and returns (archiving an archived note).
- "Now" is a parameter: the entity never reads the time, so a test controls it.
- A named factory for the real birth (`Note.write`, `Preferences.defaultsFor`), `create` to rebuild trusted data.
- Extend `AggregateRoot` when the entity raises domain events or is loaded and saved by a repository; plain `Entity`
  otherwise. Equality is by id.

## Value object

```ts
export class NoteTitle extends ValueObject<{ value: string }> {
  static create(raw: string): Either<InvalidNoteTitleError, NoteTitle> {
    const value = cleanName(raw, NOTE_TITLE_MAX_LENGTH)
    if (value === null) return left(new InvalidNoteTitleError(NOTE_TITLE_MAX_LENGTH))

    return right(new NoteTitle({ value }))
  }

  static restore(value: string): NoteTitle {
    return new NoteTitle({ value })
  }
}
```

- The constructor is private: the only ways in are `create()` (validates, returns `Either`) and `restore()` (trusted
  data from the database, no validation).
- Immutable; equal when the props are equal.
- Normalise in `create()` (trim, single spaces, lower case where it matters), so equal inputs become equal values.
  The text helpers of `core/text` do it the same way everywhere.

## Policy

A rule that only reads data is a pure function in `enterprise/policies/`, unit tested and shared by use cases:

```ts
/** Rule 0.4: a note is seen and changed by its owner only. Anyone else gets a 404, never a 403. */
export const canAccessNote = (actor: Actor, note: Note): boolean => note.ownerId.toString() === actor.id
```

Limits of a context (sizes, counts, durations) are constants in `enterprise/<context>-rules.ts`
(`notes-rules.ts`, `identity-rules.ts`), cited by the rule they come from.
