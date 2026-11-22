# Testing

Tests are born with the code. A rule of [`docs/business-rules.md`](../../business-rules.md) is done when a test with
fixed data says so, and the test names the rule: `describe('ArchiveNoteUseCase (rule 2.2)', ...)`.

## Three kinds, picked by file suffix

| Suffix                                     | Project       | What it tests                                             | Collaborators                 |
| ------------------------------------------ | ------------- | --------------------------------------------------------- | ----------------------------- |
| `*.unit.spec.ts` (next to the file)        | `unit`        | entities, value objects, policies, pure functions         | none                          |
| `*.integration.spec.ts` (next to the file) | `integration` | use cases, subscribers, contributors                      | in-memory repositories, fakes |
| `test/e2e/*.e2e-spec.ts`                   | `e2e`         | routes, guards, validation, Drizzle repositories, the SQL | the real app and a Postgres   |

```bash
npm test -w api            # unit + integration
npm run test:e2e -w api    # e2e, on PGlite: no Docker needed
npm run test:cov -w api    # coverage of unit + integration
```

## Pure code: unit tests

The arithmetic of the rules is in pure functions (`core/money`, `core/time`, `core/text`, `enterprise/policies/`), and
that is where most of the edge cases are tested: the cent that does not divide, the 31st in February, the title of
121 characters. A policy takes `today` or `now` as an argument, so its test needs no clock.

## Use cases: integration tests

No Nest module. Each context has a **world** (`test/worlds/`) that wires its in-memory repositories, fakes and the
people of the test:

```ts
describe('UpdateNoteUseCase (rules 2.1 to 2.3)', () => {
  let world: NotesWorld
  let sut: UpdateNoteUseCase

  beforeEach(() => {
    world = makeNotesWorld()
    sut = new UpdateNoteUseCase(world.notesRepository, world.clock)
  })

  it('refuses to change an archived note (rule 2.2)', async () => {
    const note = world.storedNote({ archivedAt: TEST_NOW })

    const result = await sut.execute({ actor: world.owner, noteId: note.id.toString(), title: 'New' })

    expect(result.value).toBeInstanceOf(NoteArchivedError)
  })
})
```

- `sut` is the use case. Cover the happy path and **every `Left` it declares**, and "someone else's resource" (404).
- Seed with the `make*` factories (`test/factories/`) or the world's helpers, and read `repository.items`.
- Time is `world.clock` (a `FakeClock` standing at `TEST_NOW`, 14 November 2026, 15:00 UTC). Move it with
  `world.clock.advance(MINUTE)`; never use the real clock.
- Fakes are deterministic: `FakeHasher`, `FakeEncrypter`, `FakeOpaqueTokens` (`token-1`, `token-2`...), `FakeMailer`
  (keeps what would be sent), `FakeUnitOfWork` (runs at once and counts), `FakeUserDataContributor`.
- A spec that registers event handlers clears them in `afterEach` (`DomainEvents.clearHandlers()`).

## Routes: e2e tests

`test/e2e/global-setup.ts` prepares one migrated database for the run: the embedded PGlite in memory, or a temporary
database on `DATABASE_URL` when it is set. The files run one at a time and share it, so **every test creates its own
people** and asserts only on what belongs to them.

```ts
const jane = await createAccount(app) // signs up and signs in: { id, email, password, accessToken, refreshToken }
const note = (await api(app, jane).post('/notes').send({ title: 'Groceries' }).expect(201)).body

await api(app, jane).patch(`/notes/${note.id}/archive`).expect(200)
```

- `createTestApp()` boots the real `AppModule` (guards, filter, pipe, Drizzle) with one replacement: `Clock` is a
  `FakeClock`. `clockOf(app).set(...)` moves time; the top `beforeEach` puts it back at `TEST_NOW`.
- A list whose order depends on dates advances the clock between two writes.
- E-mails: `lastEmailTo(app, address)` and `lastTokenSentTo(app, address)`.
- What an e2e spec is for: the status codes and the error `code` of each route (400 for the shape, 401 without a
  session, 404 for someone else's resource and for an id that is not a UUID's 400, 409/422 for the rules), and what
  only the database can prove (the SQL of the lists, the search with `%` and `_`, the constraints, the cascade of a
  deleted account).

The use case tests already cover every branch of the rules; an e2e spec does not repeat them one by one. It proves the
route answers what the use case decided.

## TDD loop

1. Write the failing test for one behaviour.
2. Run it and watch it fail for the right reason.
3. Write the least code that makes it pass.
4. Refactor with the tests green.
