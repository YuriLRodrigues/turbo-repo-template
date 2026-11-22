---
name: new-api-context
description: Add a bounded context to the NestJS + Drizzle API of this monorepo, end to end - rules, entity, value objects, errors, abstract repository, use cases, Drizzle schema, mapper and repository, migration, HTTP module with controllers, data contributor for export and deletion, in-memory repository, factory, world and tests. Use when the user wants a new resource or feature area in the API ("add projects", "create a comments module").
---

# New API context

The `notes` context is the reference implementation: mirror its files one by one
(`apps/api/src/domain/notes`, `infra/database/drizzle/{schema,mappers,repositories}/*note*`,
`presentations/http/controllers/notes`, `test/{factories,repositories,worlds}/*note*`, `test/e2e/notes.e2e-spec.ts`).
Patterns: `docs/patterns/api/`.

## 1. Agree on the model, then write the rules

Propose and confirm: the context name (plural kebab-case, `projects`), the aggregate (`Project`), its props and which
are value objects, the operations, who may do what (owner only by default: someone else's resource is a 404), every
business error, the events worth raising. Then write them as a numbered section of `docs/business-rules.md` (the next
free number). Every file below cites those rules.

## 2. Domain (`src/domain/<ctx>/`)

1. `enterprise/<ctx>-rules.ts` (limits), `enterprise/value-objects/*` (`create` → `Either`, `restore`),
   `enterprise/entities/<name>.entity.ts` (props type, getters, intention-revealing methods that take `now`, a named
   factory for the birth and `create` to rebuild), `enterprise/policies/*` (access and pure rules), events if any.
2. `errors/*.error.ts`: one `DomainError` per failure, codes `CONTEXT.REASON`, the right status (404, 409, 422).
3. `applications/repositories/<plural>.repository.ts`: abstract class; lists take `PaginationParams`, return
   `Paginated<T>`, say their order; `findAllOfUser` and `deleteAllOfUser` for rule 1.6.
4. `applications/account-data/<ctx>-user-data.ts`: the `UserDataContributor` (export and erase).
5. One use case per operation, injecting `Clock` for "now". Write each integration spec first (step 5).
6. Unit specs for the entity, value objects and policies (`*.unit.spec.ts`).

## 3. Infra

1. `infra/database/drizzle/schema/<plural>.ts` (relative imports, `user_id` → `users` with cascade, index for the list),
   exported from `schema/index.ts`.
2. `mappers/<name>.mapper.ts`, `repositories/drizzle-<plural>.repository.ts` (same contract as the in-memory one,
   events dispatched after writes, `containsPattern` for search, order ending with the id).
3. Bind it in `infra/database/database.module.ts`.
4. `npm run db:generate -- --name create-<plural>` from the root; read the SQL.
5. Subscribers, if any, in `infra/events/subscribers/`, registered in `events.module.ts`, catching their own errors.

## 4. HTTP (`src/presentations/http/controllers/<ctx>/`)

1. `dtos/` (request DTOs with `@Sent`/`@IsOptional` as needed, a query DTO extending `PaginationQueryDto`, response DTO
   - page DTO with examples), `view-models/<name>.view-model.ts` (`toHttp`, `toHttpPage`).
2. One controller per endpoint: `@ApiOperation` citing the rule, `@ApiPrivate(...)` with one error instance per code.
3. `<ctx>-http.module.ts` (imports `DatabaseModule`, `TimeModule`), registered in `http.module.ts`; a tag in
   `swagger.ts`.
4. The contributor added to the providers and to the `inject` list of `UserDataContributors` in
   `identity-http.module.ts`.

## 5. Tests

- `test/factories/make-<name>.ts`, `test/repositories/in-memory-<plural>.repository.ts`,
  `test/worlds/<ctx>-world.ts` (clock, repository, an owner and a stranger).
- An integration spec per use case: the happy path, every `Left`, someone else's resource.
- An integration spec for the contributor (export shape, erase only the person's data).
- `test/e2e/<ctx>.e2e-spec.ts`: each route's success, 400 for the shape, 401 without a session, 404 for someone
  else's resource and 400 for a non-UUID id, 409/422 for the rules. Add the table to the footprint of
  `account-data.e2e-spec.ts`.

## 6. Finish

1. `npm run api:openapi` and `npm run api:client` (the web app gets the typed functions).
2. A line per rule in the table of `apps/api/CLAUDE.md`.
3. Run the `pre-pr-checklist` skill.
