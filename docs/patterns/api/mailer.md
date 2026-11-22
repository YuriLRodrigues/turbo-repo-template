# Mailer

Rule 1.2: every e-mail leaves through one port. Today the e-mails are the confirmation link (rule 1.2) and the
password reset link (rule 1.5).

## The port

```ts
// domain/identity/applications/mail/mailer.ts
export abstract class Mailer {
  abstract send(message: MailMessage): Promise<void> // { to, subject, text }
}
```

`send` hands the message over and returns. It does not wait for the mail server and never rejects when the
delivery fails; the adapter logs the failure. A use case must not fail, or take longer, because of the mail
server: "if the e-mail exists, we sent the link" (rule 1.5) would otherwise tell who has an account.

## The two adapters

`infra/mail/mail.module.ts` picks one when the app starts, and the boot checklist prints which (`mail` line).

| Adapter      | When                   | What it does                                                                          |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------- |
| `LogMailer`  | `SMTP_HOST` is not set | writes the whole message to the log, link included, and keeps the last 50 in `outbox` |
| `SmtpMailer` | `SMTP_HOST` is set     | hands it to nodemailer; logs the subject only, never the address or the body          |

The log is the only place to open a link in development, which is why `LogMailer` prints all of it, and why it can
never be the adapter of production: `SMTP_HOST` is required there (`infra/env/env.ts` fails the boot without it).

```bash
# development: read the link in the terminal
 12:00:03  INFO   [Mailer] E-mail to jane@example.com: Confirm your e-mail for App
 ...
 http://localhost:3501/verify-email?token=...
```

SMTP is configured by `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_SECURE` (`true` for port 465), `SMTP_USER` and
`SMTP_PASSWORD` (both or neither), and `MAIL_FROM`. The product name said in the e-mails is `APP_NAME`.

## Writing an e-mail

1. The text is product copy, plain and short (English in the template; translate it there): a function in
   `domain/identity/applications/mail/messages.ts` that returns a `MailMessage`. No HTML. The durations in the text
   are the ones of the rules, so they are tested (`messages.unit.spec.ts`).
2. A link is built by the `AccountLinks` port (`infra/mail/web-account-links.ts`): it points to a page of the web
   app (`WEB_APP_URL`), never to the API. The web app reads the token and calls the API. The paths
   (`/verify-email`, `/reset-password`) are a contract with the web app.
3. The use case calls `mailer.send(...)` after the data is saved, and does not look at the result.

## Tests

Nothing is ever sent from a test.

- Use cases get `FakeMailer` (`test/mail/fake-mailer.ts`), which keeps the messages in `sent`; `tokenIn(message)`
  reads the token out of a link.
- The e2e app has no `SMTP_HOST`, so it runs on `LogMailer`; `lastEmailTo(app, address)` and
  `lastTokenSentTo(app, address)` read its `outbox`.
- `SmtpMailer` is tested with a stub transport (`mail.unit.spec.ts`): the shape of what goes to nodemailer, and
  that a failed delivery is logged and not thrown.

A context that needs to send something else (a reminder, an invite) writes its own message functions and reuses
this port; it does not talk to nodemailer.
