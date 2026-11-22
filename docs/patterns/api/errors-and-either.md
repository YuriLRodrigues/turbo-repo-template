# Errors and Either

A business failure is a **value**, not an exception. Use cases return `Either<L, R>` (`core/logic/either.ts`):

```ts
const titleOrError = NoteTitle.create(title)
if (titleOrError.isLeft()) return left(titleOrError.value)
```

The `Left` side of a use case's output lists exactly the errors that can happen, and its integration spec covers each
of them. A `throw` is for what should never happen (a bug, a database that is down) and becomes a 500.

## Domain errors

Every business error extends `DomainError` (`core/errors/domain-error.ts`) with a stable code and an HTTP status:

```ts
/** Rule 2.2: an archived note is read-only until it is unarchived. */
export class NoteArchivedError extends DomainError {
  readonly code = 'NOTE.ARCHIVED'
  readonly httpStatus = 409

  constructor() {
    super('The note is archived. Unarchive it before changing it.')
  }
}
```

- `code` is `CONTEXT.REASON` in capitals. It is a **contract** with every client (`@workspace/api-client` branches on
  it): never rename or reuse one (rule 0.5).
- `details` carries what a client may need to show the error well (`{ maxLength: 120 }`), never a secret.
- The domain never imports anything HTTP-specific: `httpStatus` is a number the HTTP layer reads.

Usual statuses: 404 for something that does not exist **or belongs to someone else** (rule 0.4, never 403), 409 for a
state that forbids the action, 422 for a value the rules refuse, 429 for limits.

## The one error shape

`HttpErrorFilter` (`presentations/http/errors/http-error.filter.ts`) renders every error as:

```json
{ "statusCode": 409, "code": "NOTE.ARCHIVED", "message": "The note is archived. Unarchive it before changing it." }
```

| What happened                                  | `code`                                           |
| ---------------------------------------------- | ------------------------------------------------ |
| a `DomainError`                                | its own code                                     |
| the `ValidationPipe` refused the body or query | `VALIDATION.FAILED` (with `details.errors`)      |
| a `ParseUUIDPipe` or another Nest exception    | `HTTP.BAD_REQUEST`, `HTTP.UNAUTHORIZED`…         |
| a write for an account deleted meanwhile       | `HTTP.UNAUTHORIZED` (see [auth](./auth.md))      |
| anything else                                  | a 500 with a generic code, logged with the stack |

DTOs validate the **shape** (400). Business rules belong to the domain (422). Do not duplicate a rule in a DTO.
