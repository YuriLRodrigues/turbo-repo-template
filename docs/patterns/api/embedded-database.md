# Embedded database

`npm run dev -w api` works on a fresh clone: no Docker, no Postgres to install, no `.env`.

## Which database a run is on

| `DATABASE_URL` | `NODE_ENV`           | The API uses                                                              |
| -------------- | -------------------- | ------------------------------------------------------------------------- |
| set            | any                  | that Postgres. Migrations are applied by you: `npm run db:migrate -w api` |
| not set        | `development`        | the embedded PGlite, started by the API itself, migrations applied by it  |
| not set        | `test`, `production` | nothing: the boot fails ("DATABASE_URL is required outside development")  |

The boot checklist names it, so nobody has to guess:

```
   ✔ env       validated (zod), local JWT secret
   ✔ PGlite    embedded in .pglite/data, port 63415
   ✔ mail      written to the log (no SMTP_HOST)
```

With `DATABASE_URL` the second line is `✔ Postgres  app on localhost:5432`. A Postgres that is down does not stop
the boot: the line turns red and the API answers 500 until it is back.

## How it works

[PGlite](https://pglite.dev) is Postgres compiled to WebAssembly, running inside the Node process.
`infra/database/embedded/embedded-postgres.ts` starts it behind a local socket (`127.0.0.1`, a free port), so the
rest of the app talks to it with `pg`, exactly as it talks to a real server. Nothing else in the code knows the
difference: same Drizzle, same SQL, same migrations.

`DrizzleService.onModuleInit` does it, in this order: start PGlite, apply the pending migrations
(`infra/database/migrate.ts`, the same migrator production uses), open the pool. A seed that every environment needs
(reference data) would run right after, from a provider of `DatabaseModule` with its own line in the checklist.

Three things to know:

- **One connection.** PGlite is a single session, however many clients connect: two connections would see each
  other's transaction. The pool is therefore capped at one connection (`EMBEDDED_POOL_MAX`), and requests take
  turns. It is a development database, not a fast one.
- **One API per folder.** PGlite does not stop two processes from opening the same folder, and they then lose each
  other's rows without any error. So the API takes a lock while it runs (`lockDataDir`), and a second one refuses to
  boot: "The embedded database ... is already open in another process". The lock is a local socket, which the
  system closes however the process dies; `.pglite/data.lock` only says where it is. A file left by a process that
  was killed is taken over on the next start. To run two APIs side by side, give the second its own
  `PGLITE_DATA_DIR`.
- **It is a development dependency.** The two packages are loaded with a dynamic `import()` only when needed. A
  production install without dev dependencies never touches them.

## Where the data lives

`apps/api/.pglite/` (gitignored):

| Path                     | What                                                                        |
| ------------------------ | --------------------------------------------------------------------------- |
| `.pglite/data/`          | the database files. They survive restarts, also the hard ones of `--watch`  |
| `.pglite/data.lock`      | which API has the folder open (pid and lock port); removed when it stops    |
| `.pglite/dev-jwt-secret` | the JWT secret of this machine, created once, so sessions survive a restart |

The secret is generated only in development and only when `JWT_SECRET` is not set
(`infra/env/local-state.ts`). Outside development a missing secret fails the boot.

**To start from an empty database, stop the API and delete `apps/api/.pglite/data`** (or the whole folder).

| Variable          | Default                 | Use                                                     |
| ----------------- | ----------------------- | ------------------------------------------------------- |
| `PGLITE_DATA_DIR` | `apps/api/.pglite/data` | another folder, or `memory://` to keep nothing          |
| `PGLITE_PORT`     | `0` (a free port)       | a fixed port, to connect `psql` or Drizzle Studio to it |

To look inside with a client, start the API with `PGLITE_PORT=5433` and connect to
`postgresql://postgres:postgres@127.0.0.1:5433/postgres` while it runs. Remember the single session: a client that
leaves a transaction open blocks the API.

## When the schema changes

A new migration is applied on the next start, like anywhere else. If the migrations themselves were rewritten
(the folder in `drizzle/` was regenerated instead of added to), the embedded database no longer matches them and
the boot fails with "Could not apply the migrations to the embedded database". Delete `.pglite/data` and start
again.

## The same helper elsewhere

- **E2E tests** (`test/e2e/global-setup.ts`): `startEmbeddedPostgres({ dataDir: 'memory://' })`, one database for
  the run, unless `DATABASE_URL` is set (then a temporary database is created on that server).
- **OpenAPI export** (`tooling/export-openapi.mjs`): boots the compiled app with `PGLITE_DATA_DIR=memory://` just
  long enough to read `/docs-json`.

## Using a real Postgres in development

Set `DATABASE_URL` in `apps/api/.env` (`.env.example` has the one of `docker-compose.yml`), then
`npm run db:migrate -w api`. Do this before trusting anything that depends on real concurrency or performance.
