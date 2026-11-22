# Logging and the terminal

One logger for the whole app: `AppLogger` (`src/infra/logger/app-logger.ts`). It is Nest's `LoggerService`, so
`new Logger(MyClass.name)` anywhere ends up in it, and it also draws the boot.

## Rules

1. **Log through Nest's `Logger`**, never `console.log`:

   ```ts
   private readonly logger = new Logger(OnNoteArchived.name)

   this.logger.log(`Note ${note.id} archived`)
   ```

2. **The domain does not log.** A use case returns `Left(error)`; whoever sits at the edge (a subscriber, the HTTP
   filter, a repository) decides what is worth a line.
3. **Pass the `Error`, not its message**: `this.logger.error(error)`. The logger prints the block with the stack in
   `pretty` and a `stack` field in `json`. A string loses the stack.
4. **Expected errors are not logged as errors.** A `DomainError` (404, 409, 422) is a normal answer: the request line
   already shows the status and the `code`. Only the unexpected (5xx) gets the red block.
5. **Never log secrets or personal data**: no passwords, tokens, `Authorization` headers or request bodies.

## Two formats

| `LOG_FORMAT` | For whom                                 | What it writes                                                |
| ------------ | ---------------------------------------- | ------------------------------------------------------------- |
| `pretty`     | a person reading a terminal              | banner, boot checklist, route table, colored request lines    |
| `json`       | a log collector (the production default) | one object per line: `time`, `level`, `message`, `context`, … |

A request in `json`:

```json
{
  "time": "2026-01-01T17:32:07.000Z",
  "level": "warn",
  "message": "request",
  "method": "GET",
  "path": "/notes/:id",
  "status": 404,
  "durationMs": 3,
  "code": "NOTE.NOT_FOUND",
  "requestId": "9f8e7d6c-…",
  "actor": "USER 1a2b3c4d"
}
```

The `path` is the route pattern, not the URL: `/notes/:id` groups every note in a dashboard and keeps ids out of the
logs.

## Request id

The middleware (`request-log.middleware.ts`) reuses the incoming `x-request-id` (from a proxy or the frontend) or
creates one, and echoes it in the response header. Put it in a bug report and you find the line.

## The boot

`src/main.ts` runs the steps in order and reports each one with `logger.check(...)`:

```ts
logger.check({ status: 'ok', label: 'Postgres', detail: 'connected', durationMs })
logger.check({ status: 'fail', label: 'Redis', detail: error.message, hint: 'docker compose up -d' })
```

- A new dependency (cache, queue, mail) gets a check there. `fail` does not stop the boot by itself: decide in
  `main.ts` whether the app can live without it.
- An exception during the boot reaches `logger.bootFailed(error)`, which prints the whole message, a hint for the
  usual causes (`explainBootError` in `terminal/boot.ts`) and exits with code 1.
- The route table comes from `collectRoutes(app)` (`presentations/http/route-catalog.ts`), which reads `@Public()`
  and `@Roles()`. A new access decorator must be taught there, or the table will lie.

## Where things live

```
src/infra/logger/
├── app-logger.ts              # LoggerService + boot (banner, check, routes, ready, bootFailed) + request
├── logger-config.ts           # LOG_* variables, never throws
├── request-log.middleware.ts  # one line per request, x-request-id
└── terminal/                  # pure renderers: text in, lines out, no I/O (except the background query)
    ├── ansi.ts  color-support.ts  background.ts  palette.ts
    ├── glyphs.ts  gradient.ts  banner.ts
    └── boot.ts  route-table.ts  request-line.ts  error-block.ts  time-format.ts
```

Renderers receive a `Painter` and a `Palette` and return strings, so every one of them is tested without a terminal
(`terminal.unit.spec.ts`). A renderer never writes a hex color: it asks the palette for a role (`palette.error`).

## Colors

- `NO_COLOR` turns colors off; `FORCE_COLOR=1|2|3` forces 16, 256 or 24-bit colors; without a TTY nothing is colored.
- The palette follows the terminal background (`LOG_BACKGROUND=auto|dark|light`). `auto` reads `COLORFGBG`, then asks
  the terminal (OSC 11) and falls back to dark.
- The banner draws `LOG_BRAND` (default: `APP_NAME` in capitals) and the signature in `terminal/banner.ts` (`SIGNATURE`).
