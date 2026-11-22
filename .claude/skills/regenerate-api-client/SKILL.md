---
name: regenerate-api-client
description: After a route, a DTO or an error of the API changed, export the OpenAPI document and regenerate the Orval client in packages/api-client, then fix what the new contract breaks. Use when the user says "update the client", "regenerate the types", or after any change to apps/api/src/presentations.
---

# Regenerate the API client

1. `npm run api:openapi` (from the root): builds the API and writes `apps/api/openapi.json` by booting it on an
   in-memory PGlite for a moment. It needs no database and no `.env`.
2. `npm run api:client`: Orval writes `packages/api-client/src/gen/endpoints/<tag>.ts` and `src/gen/models/*` from that
   file. Never edit `src/gen` by hand.
3. `git diff apps/api/openapi.json packages/api-client/src/gen`: read what changed. A surprise (a nullable string typed
   as an object, an operation renamed) is a decorator to fix in the API, then back to step 1.
4. `npm run typecheck`: the web app fails where it used the old contract. Fix the callers, not the generated types.
5. `npm test -w @workspace/api-client` and `npm test -w web`.
6. Commit `openapi.json` and `src/gen` together with the API change that produced them.

Notes:

- The function names are the operation ids, which are the controllers' names (`ListNotesController` → `listNotes`).
- Route params are an object (`updateNote({ id }, body)`); every function returns `{ status, data, headers }`; use
  `unwrap()` to get the data or an `ApiError`.
- `OPENAPI_URL=http://localhost:3500/docs-json npm run api:client` generates from a running API instead.
