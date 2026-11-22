# Repositories and dependency injection

The domain declares what it needs as an **abstract class**; infra implements it; one module binds them. The abstract
class is the injection token, so a use case never names an infra class.

```ts
// domain/notes/applications/repositories/notes.repository.ts
export abstract class NotesRepository {
  abstract findById(id: string): Promise<Note | null>
  abstract findMany(params: FindManyNotesParams): Promise<Paginated<Note>>
  abstract findAllOfUser(userId: string): Promise<Note[]>
  abstract create(note: Note): Promise<void>
  abstract save(note: Note): Promise<void>
  abstract delete(note: Note): Promise<void>
  abstract deleteAllOfUser(userId: string): Promise<void>
}
```

```ts
// infra/database/database.module.ts
const bindings = [
  { provide: UnitOfWork, useClass: DrizzleUnitOfWork },
  { provide: NotesRepository, useClass: DrizzleNotesRepository },
  // ...
]
```

Rules:

- One repository per aggregate, named in the plural (`NotesRepository`). Methods say what they return and in which
  order (`/** Rule 2.3: pinned first, then the most recently changed. */`).
- `create`, `save` and `delete` dispatch the aggregate's domain events **after** the write
  (`DomainEvents.dispatchEventsForAggregate(note.id)`).
- Lists take `PaginationParams` and return `Paginated<T>` ([listing contract](./listing-contract.md)).
- A mapper (`infra/database/drizzle/mappers/note.mapper.ts`) is the only place where a row becomes an entity and back.
  Columns can differ from props (`user_id` in the table, `ownerId` in the entity).
- The in-memory twin (`test/repositories/in-memory-notes.repository.ts`) keeps **the same contract**: the same order,
  the same filters (case-insensitive, like `ilike`), the same event dispatch. Use case tests run on it.
- Something a context needs from outside that is not its own aggregate is a **port** (an abstract class too):
  `Mailer`, `AccountLinks`, `OpaqueTokens`, `Clock`, `UserDataContributor`.

A use case takes its dependencies in the constructor; Nest injects them by the abstract class, a test passes the
in-memory or fake ones by hand (`new ArchiveNoteUseCase(world.notesRepository, world.clock)`).
