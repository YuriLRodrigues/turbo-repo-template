---
name: new-api-route
description: Add one use case and its HTTP route to an existing bounded context of the API - rule, use case with its integration spec, errors, controller with OpenAPI docs, e2e spec, then the regenerated client. Use for "add an endpoint", "let users duplicate a note", "add a filter to the list".
---

# New API route

Closest examples: `archive-note.use-case.ts` + `archive-note.controller.ts` (a state change),
`list-notes.use-case.ts` + `list-notes.controller.ts` (a list with filters), `update-note.use-case.ts` (a PATCH).

1. **Rule.** Write or extend the numbered rule in `docs/business-rules.md`. Decide the errors (`CONTEXT.REASON`,
   status) and add the `DomainError` classes in `domain/<ctx>/errors/`.
2. **Test first.** `domain/<ctx>/applications/use-cases/<verb>-<noun>.use-case.integration.spec.ts` with the world of
   the context: the happy path, every `Left`, someone else's resource. Run it and watch it fail.
3. **Use case.** `<verb>-<noun>.use-case.ts`: input/output types, `Either`, `Clock` for "now", validate everything
   before changing anything, `unitOfWork.run` for writes that go together. A new entity method or policy gets its unit
   spec. A new repository method is added to the abstract class, the Drizzle repository and the in-memory one, with
   the same behaviour.
4. **HTTP.** DTOs (shape only) and, when the response changes, the response DTO and view model. A controller per
   endpoint with `@ApiOperation` (summary + the rule), the response type, and `@ApiPrivate(...)` listing one error
   instance per code. Register the controller and the use case in the context's HTTP module.
5. **E2E.** Extend `test/e2e/<ctx>.e2e-spec.ts`: success, 400, 401, 404 for someone else's resource, the rule's 409/422.
6. **Schema?** If a column changed: `npm run db:generate -- --name <what-changed>` and read the SQL.
7. **Client.** `npm run api:openapi` then `npm run api:client`; fix what `npm run typecheck` reports in the web app.
8. Run the `pre-pr-checklist` skill.
