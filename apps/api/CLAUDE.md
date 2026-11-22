# CLAUDE.md — apps/api

## What this is

The backend: NestJS 12 + Drizzle ORM 1.0 on Postgres, with clean architecture. `identity` is complete (sign-up,
sign-in, rotating refresh tokens, sessions, e-mail confirmation, password reset, preferences, export and deletion of
the account). `notes` is the example context: copy its shape for a new one.

**The rules are numbered in `docs/business-rules.md` (repository root). That document is the contract.** Code, tests,
error messages and OpenAPI descriptions cite the rule they implement ("rule 2.2"). Do not invent a rule: when the
document is silent, write the rule there first (or ask).

## Commands

From the repository root, scoped to this workspace:

```bash
npm run dev -w api                 # API on :3500, Swagger at /docs. No .env, no Docker: embedded PGlite
npm test -w api                    # unit + integration
npm run test:e2e -w api            # e2e over HTTP, on PGlite (or on DATABASE_URL when it is set)
npm run lint:check -w api          # ESLint (type-checked, includes the layer rules)
npm run typecheck -w api
npm run build -w api
npm run db:generate -w api -- --name <kebab-name>   # migration from the schema diff
npm run docs:openapi -w api        # builds and writes apps/api/openapi.json
```

Without `DATABASE_URL`, development runs on an embedded Postgres (PGlite) kept in `apps/api/.pglite/`
(`docs/patterns/api/embedded-database.md`). The boot checklist says which database the run is on. Every variable is
validated by `src/infra/env/env.ts` (zod); `.env.example` lists them.

## Architecture

- `src/core`: framework-free building blocks: `Entity`, `AggregateRoot`, `ValueObject`, `UniqueEntityId`, `Either`,
  `DomainError`, `DomainEvents`, pagination, `Actor`, `money/` (cents, largest remainder), `time/` (calendar dates,
  time zones, `Clock`, `UserCalendar`), `text/` (sizes, normalisation) and `persistence/unit-of-work.ts`.
- `src/domain/<context>`: `enterprise/` (entities, value objects, policies, events, `<context>-rules.ts`),
  `applications/` (use cases, abstract repositories and ports, helpers in `services/`, the `account-data`
  contributor), `errors/`.
- `src/infra`: env, Drizzle (schema, mappers, repositories, migrator, embedded database), cryptography, mail, time,
  event subscribers, logger.
- `src/presentations/http`: one controller per endpoint, DTOs, view models, guards, the error filter, Swagger, one
  HTTP module per context.

The dependency rule (core ← domain ← infra / presentations) is enforced by ESLint (`packages/config/eslint/nest.mjs`).
Never silence it with `eslint-disable`; move the code to the right layer.

## Rules

1. Use cases return `Either<DomainError, T>` and never throw for business rules. Output values are wrapped in an
   object (`right({ note })`). The `Left` side lists exactly the errors that can happen.
2. Controllers: call the use case, `if (result.isLeft()) throw result.value`, return `ViewModel.toHttp(...)`.
3. Use cases depend on abstract classes (the DI tokens), never on infra classes. A use case never imports another
   use case: use a policy, a repository method, a domain event or a helper in `applications/services/`.
4. A context never reads another context's tables for its own rules: a port, an event or a contributor
   (`docs/patterns/api/contexts-and-ports.md`).
5. Every business error extends `DomainError` with a stable `CONTEXT.REASON` code and an HTTP status. Never rename or
   reuse a code. Someone else's resource answers 404, never 403.
6. Entities never leave through HTTP: response DTO + view model. Secrets (password hash, token hashes) never leave.
7. DTOs validate shape; the domain validates business rules and answers 422. The global `ValidationPipe` forbids
   unknown fields.
8. Every route is private unless marked `@Public()`. Read the caller with `@CurrentActor()`; restrict with
   `@Roles('ADMIN')`.
9. Lists follow the listing contract: `page`/`limit` in, `{ results, meta }` out.
10. Money is an integer number of cents. A day is a `YYYY-MM-DD` text. "Now" comes from the injected `Clock`, "today"
    from `UserCalendar.today(userId)`. Never `new Date()` or `Date.now()` in the domain or a repository.
11. More than one write that must happen together goes inside `unitOfWork.run(...)`.
12. Every route is documented for OpenAPI: `@ApiOperation`, the response DTO with examples, and `@ApiPrivate(...)` /
    `@ApiErrors(...)` with one error instance per code the route can answer. The operation id is the controller's
    name, which becomes the function name in `@workspace/api-client`.
13. Never write or edit a migration by hand: change the schema, run `db:generate`, review the SQL. Every table of a
    person has a `user_id` column referencing `users` with `onDelete: 'cascade'`.
14. Tests are born with the code: `*.unit.spec.ts` for pure code, `*.integration.spec.ts` for every use case (cover
    every `Left`), e2e for every route (`docs/patterns/api/testing.md`).
15. Log through Nest's `Logger`, pass the `Error` itself to `logger.error`, never log secrets or request bodies. The
    domain does not log.
16. E-mail copy is in `domain/identity/applications/mail/messages.ts` and says the product name from `APP_NAME`.

## Naming

| Thing                  | File                                              | Class or function         |
| ---------------------- | ------------------------------------------------- | ------------------------- |
| Entity                 | `note.entity.ts`                                  | `Note`                    |
| Value object           | `note-title.ts`                                   | `NoteTitle`               |
| Policy (pure rule)     | `note-access.policy.ts`                           | `canAccessNote()`         |
| Limits of a context    | `notes-rules.ts`, `identity-rules.ts`             | constants                 |
| Use case               | `archive-note.use-case.ts`                        | `ArchiveNoteUseCase`      |
| Error                  | `note-archived.error.ts`                          | `NoteArchivedError`       |
| Event                  | `note-archived.event.ts`                          | `NoteArchivedEvent`       |
| Abstract repository    | `notes.repository.ts`                             | `NotesRepository`         |
| Contributor (rule 1.6) | `notes-user-data.ts`                              | `NotesUserData`           |
| Drizzle repository     | `drizzle-notes.repository.ts`                     | `DrizzleNotesRepository`  |
| Mapper                 | `note.mapper.ts`                                  | `NoteMapper`              |
| Controller             | `archive-note.controller.ts`                      | `ArchiveNoteController`   |
| View model             | `note.view-model.ts`                              | `NoteViewModel`           |
| Subscriber             | `on-note-archived.subscriber.ts`                  | `OnNoteArchived`          |
| In-memory repository   | `test/repositories/in-memory-notes.repository.ts` | `InMemoryNotesRepository` |
| Factory                | `test/factories/make-note.ts`                     | `makeNote()`              |
| World (wired context)  | `test/worlds/notes-world.ts`                      | `makeNotesWorld()`        |

## Where each rule lives

| Rule                        | Where                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| 0.1 money                   | `core/money/money.ts`, `core/money/largest-remainder.ts`                                  |
| 0.2, 0.3 days and "today"   | `core/time/` (`calendar-date.ts`, `time-zone.ts`, `clock.ts`), `infra/time/`              |
| 0.4 owner, 404              | `canAccessNote` and the identity use cases                                                |
| 0.5 error codes             | `domain/<context>/errors/`, rendered by `presentations/http/errors/http-error.filter.ts`  |
| 0.8 sizes                   | `core/text/text.ts`                                                                       |
| 1.1 sign-up                 | `register-user.use-case.ts`, `value-objects/email.ts`, `policies/password.policy.ts`      |
| 1.2 e-mail confirmation     | `verify-email`, `resend-email-verification`, `services/account-link-sender.ts`, `mail/`   |
| 1.3 session, refresh, reuse | `authenticate-user`, `refresh-session`, `sign-out`, `list-sessions`, `revoke-session`     |
| 1.4 attempts                | `policies/sign-in-lock.policy.ts`, `sign-in-attempts.repository.ts`                       |
| 1.5 password reset          | `request-password-reset`, `reset-password`                                                |
| 1.6 export and delete       | `export-user-data`, `delete-user-account`, `account-data/` (one contributor per context)  |
| 1.7, 1.8 preferences        | `entities/preferences.entity.ts`, `enterprise/preferences/`, `get-`/`update-preferences`  |
| 2.1 to 2.4 notes            | `domain/notes/` (`note.entity.ts`, `note-title.ts`, `note-body.policy.ts`, the use cases) |

Routes: `/auth/*`, `/me`, `/me/preferences`, `/me/sessions`, `/me/export`, `/me/delete`, `/users` (ADMIN), `/notes`,
`/notes/:id`, `/notes/:id/archive|unarchive`, `/health`.

## Adding a bounded context

Use the `new-api-context` skill. In short:

1. `domain/<context>/` with its entities, policies, use cases, errors, abstract repositories and contributor.
2. Schema in `infra/database/drizzle/schema/`, mapper, Drizzle repository, binding in `database.module.ts`, then
   `db:generate`.
3. `presentations/http/controllers/<context>/` with its HTTP module, registered in `http.module.ts`; a tag in
   `swagger.ts`.
4. The contributor added to the two lists in `identity-http.module.ts`.
5. In-memory repositories, factories and a world in `test/`; an e2e spec per group of routes.
6. Its rules in `docs/business-rules.md` and a line in the table above.
