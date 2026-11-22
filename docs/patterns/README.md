# Patterns

How the code of this monorepo is written. Each document is short and points at the example in the code: the `notes`
context in the API and the notes screen in the web app are the reference implementations, end to end.

## API (`apps/api`)

| Document                                                          | Read it when you                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| [Use cases and controllers](./api/use-cases-and-controllers.md)   | add an action or a route                                  |
| [Entities and value objects](./api/entities-and-value-objects.md) | model state and rules                                     |
| [Errors and Either](./api/errors-and-either.md)                   | add a business error or wonder which status to answer     |
| [Repositories and DI](./api/repositories-and-di.md)               | read or write data, or need something from outside        |
| [Domain events](./api/domain-events.md)                           | react to something that happened                          |
| [DTOs and view models](./api/dtos-and-view-models.md)             | shape a request or a response                             |
| [Listing contract](./api/listing-contract.md)                     | write a list                                              |
| [Database and migrations](./api/database-and-migrations.md)       | change the schema                                         |
| [Embedded database](./api/embedded-database.md)                   | run the API locally, or wonder which database a run is on |
| [Contexts and ports](./api/contexts-and-ports.md)                 | need another context, or write in more than one place     |
| [Auth](./api/auth.md)                                             | touch sign-in, the refresh token, cookies or sessions     |
| [Mailer](./api/mailer.md)                                         | send an e-mail, or set up SMTP                            |
| [Money and time](./api/money-and-time.md)                         | handle an amount, a date, "today" or a month              |
| [Logging](./api/logging.md)                                       | log something or add a line to the boot                   |
| [Testing](./api/testing.md)                                       | write any test of the API                                 |

## Front (`apps/web`, `apps/landing`, `packages/ui`, `packages/api-client`)

| Document                                | Read it when you                                            |
| --------------------------------------- | ----------------------------------------------------------- |
| [Static export](./web/static-export.md) | wonder why there is no server, or add a page                |
| [Auth in the browser](./web/auth.md)    | touch the session, a 401, or the pages the e-mails point to |
| [Data fetching](./web/data-fetching.md) | read or change data, or regenerate the client               |
| [Forms](./web/forms.md)                 | write a form                                                |
| [Design system](./web/design-system.md) | style anything, add a component, or rebrand                 |
| [Layout](./web/layout.md)               | lay out a screen (read the first section before any grid)   |
| [Scroll areas](./web/scroll-area.md)    | something may scroll or a row may not fit                   |
| [Charts](./web/charts.md)               | show numbers as a chart                                     |
| [Languages (i18n)](./web/i18n.md)       | translate the landing, add a key, a language or a page      |
| [Testing the front](./web/testing.md)   | write a test of the front or take the screenshots           |

## The contract

[`docs/business-rules.md`](../business-rules.md) numbers the rules of the product. Code, tests, error messages and
the OpenAPI descriptions cite the rule they implement ("rule 2.2"). A new feature starts by writing its rules there.
