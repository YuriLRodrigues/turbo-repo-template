---
name: pre-pr-checklist
description: Everything to run and check before opening a pull request in this monorepo - lint, format, types, unit and e2e tests, build, contract and migrations, contrast, screenshots, docs, commit messages. Use before any PR, or when the user asks "is this ready?".
---

# Before opening a PR

Run from the root and read the output; every line must be green.

```bash
npm run lint:check
npm run format:check
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Then, depending on what changed:

| Changed                                  | Also                                                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| a route, a DTO, an error code            | `npm run api:openapi && npm run api:client`, commit `openapi.json` and `src/gen`                |
| the Drizzle schema                       | a migration from `npm run db:generate -- --name …`; then `db:generate` says "No schema changes" |
| a rule                                   | `docs/business-rules.md` updated; tests and errors cite the number                              |
| a token, a color, the appearance options | `npm run contrast`; the API's appearance lists if the options changed                           |
| a screen or a component                  | `npm run screenshots -w web` with the API and the preview running; look at the pictures         |
| a pattern or a convention                | the doc in `docs/patterns/` and the `CLAUDE.md` concerned                                       |
| a dependency                             | exact version, in the workspace that uses it                                                    |

Review the diff yourself:

- No `eslint-disable` added to get around a rule; no `--no-verify`.
- No secret, token, personal data or local path in code, tests or fixtures.
- No `new Date()` / `Date.now()` in the domain; no raw color, no raw overflow, no hand-drawn chart in the front.
- Every new use case has an integration spec covering each `Left`; every new route an e2e spec; every new
  schema or helper of the front a spec.
- Copy in English, short, saying what to do.

Commits follow Conventional Commits with the workspace as scope (`feat(api): archive notes`), one logical change each.
The PR description says what changed, why, how it was verified (the commands above) and what is left out.
