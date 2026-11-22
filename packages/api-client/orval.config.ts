import { defineConfig } from 'orval'

/**
 * The client is generated from the document the API exports and commits (`npm run docs:openapi -w api`), so
 * `npm run gen` works with the API down. Another source: `OPENAPI_URL=http://localhost:3500/docs-json npm run gen`.
 *
 * The API names every operation after its controller (`ListNotesController` -> `listNotes`), so the functions keep
 * the operation ids as they are.
 */
const target = process.env.OPENAPI_URL ?? '../../apps/api/openapi.json'

export default defineConfig({
  api: {
    input: { target },
    output: {
      clean: true,
      // One file per OpenAPI tag: src/gen/endpoints/notes.ts, src/gen/endpoints/auth.ts, ...
      mode: 'tags',
      target: 'src/gen/endpoints/api.ts',
      schemas: 'src/gen/models',
      client: 'fetch',
      mock: false,
      override: {
        // Route params as a named object: `updateNote({ id }, body)`.
        useNamedParameters: true,
        // The transport: base URL, access token, refresh-and-retry, one return shape.
        mutator: { path: 'src/http/custom-fetch.ts', name: 'customFetch' },
      },
    },
  },
})
