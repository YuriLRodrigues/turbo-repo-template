# Contexts and ports

A bounded context is a folder of `src/domain/` with its own entities, rules, use cases and errors: `identity` and the
example `notes` today. As the product grows, contexts start needing each other. This is how they talk without
knowing each other's insides.

## The direction of dependency

```
identity  <-  notes  <-  (a context about notes, later)
```

A context may import from a context it depends on, plainly: `notes` imports `UserDataContributor` from `identity`.
The opposite is never allowed, and a cycle is a design error. When the arrow would point backwards, use one of the
three tools below.

## 1. A port: "I need an answer from outside"

A context declares a small abstract class with exactly what it needs, in its own `applications/`, and infra answers
it. Examples in the template: `Mailer` and `AccountLinks` (identity needs to send e-mails and build links),
`OpaqueTokens`, `Encrypter`, `HashGenerator`.

When a context needs **data** another context keeps (a sum, a yes/no), the port asks for that data, not for the other
context's entities:

```ts
// domain/projects/applications/usage/note-usage.ts (an imagined context)
export abstract class NoteUsage {
  abstract countOfProject(projectId: string): Promise<number>
}
```

Infra answers it with SQL over the other context's table, `database.module.ts` binds it, and the policies of the
asking context do the arithmetic on what comes back. In tests the port is answered from the other context's in-memory
repository.

## 2. A domain event: "something happened, whoever cares may react"

When nothing needs to come back. `notes` raises `NoteArchivedEvent`; a subscriber in `infra/events/subscribers/`
reacts ([domain events](./domain-events.md)). The context that raises it does not know who listens. A subscriber
catches its own errors: a reaction that fails must never fail the change that was saved.

## 3. A contributor: "one context must do something to all the others"

Rule 1.6 (export my data, delete my account) belongs to identity, but identity does not know what the other contexts
keep. Each context implements a small port for its own data:

```ts
// domain/identity/applications/account-data/user-data-contributor.ts
export abstract class UserDataContributor {
  abstract readonly section: string
  abstract export(userId: string): Promise<Record<string, unknown>>
  abstract erase(userId: string): Promise<void>
}
```

`IdentityUserData` and `NotesUserData` are the two today. `identity-http.module.ts` lists them in the order of
dependency (identity first); the export walks the list in order and the deletion walks it backwards, inside one unit
of work, so a failure leaves the account whole. **A new context adds its contributor to that list** and the two use
cases do not change.

## Sharing code between use cases

A use case never imports another use case (lint error). Instead:

- a **policy** in `enterprise/policies/`, when it is a pure rule (`canAccessNote`, `parseNoteBody`);
- a **helper** in `applications/services/`, when it needs repositories (`SessionIssuer`, `AccountLinkSender`);
- a **repository method**, when it is a query;
- a **domain event**, when it is a side effect.

## Writing in more than one place

More than one write that must succeed or fail together goes inside the unit of work (`reset-password.use-case.ts`):

```ts
await this.unitOfWork.run(async () => {
  await this.usersRepository.save(user)
  await this.userTokensRepository.save(userToken)
  await this.refreshTokensRepository.revokeAllOfUser(user.id.toString(), now)
})
```

`UnitOfWork` is a port of `core/persistence`; `DrizzleUnitOfWork` runs the callback in a transaction and the Drizzle
repositories join it by themselves. In tests `FakeUnitOfWork` runs the callback at once and counts the runs.
