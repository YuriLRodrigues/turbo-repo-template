# Domain events

A side effect that the action itself does not need ("when a note is archived, tell someone") is a domain event, so
the use case does not grow and the reaction can fail without failing the request.

## Raising

An aggregate records the event while it changes; the repository dispatches it after the write succeeds:

```ts
// enterprise/entities/note.entity.ts
archive(now: Date): void {
  if (this.isArchived) return
  // ...
  this.addDomainEvent(new NoteArchivedEvent(this, now))
}
```

```ts
// enterprise/events/note-archived.event.ts
export class NoteArchivedEvent implements DomainEvent {
  constructor(
    readonly note: Note,
    readonly occurredAt: Date,
  ) {}

  getAggregateId(): UniqueEntityId {
    return this.note.id
  }
}
```

Names are in the past tense (`NoteArchivedEvent`). `occurredAt` comes from the caller's clock, like every "now".

## Reacting

A subscriber lives in `infra/events/subscribers/`, is a provider of `EventsModule` and registers itself when the
module starts (`on-note-archived.subscriber.ts`):

```ts
setupSubscriptions(): void {
  this.unregister = DomainEvents.register<NoteArchivedEvent>((event) => this.handle(event), NoteArchivedEvent.name)
}

private handle({ note }: NoteArchivedEvent): void {
  try {
    // the side effect: a notification, an e-mail, a job, another context reacting
  } catch (error) {
    this.logger.error(`Could not handle NoteArchivedEvent for note ${note.id.toString()}`, error)
  }
}
```

- **A subscriber catches its own errors.** Handlers are awaited after the write, so an exception would turn a saved
  change into a 500.
- The event bus is in process (`core/events/domain-events.ts`). A job that must survive a restart belongs to a queue:
  the subscriber is then the one that enqueues it.
- One context may listen to another's events: that is how two contexts cooperate without importing each other
  ([contexts and ports](./contexts-and-ports.md)).

## Testing

The subscriber has an integration spec that runs the real use case on in-memory repositories and checks the effect
(`on-note-archived.subscriber.integration.spec.ts`). Clear the handlers after each test
(`DomainEvents.clearHandlers()`, `DomainEvents.clearMarkedAggregates()`).
