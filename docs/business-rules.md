# Business rules

A living document. Each rule has a number so it can be cited in a test, in a commit and in a conversation
("rule 2.2"). The names in `code` (errors, states, fields) are the ones the system uses. Sections 0 and 1 come with
the template; section 2 is the example context (`notes`): replace it with the rules of your product, keep the habit.

## 0. Conventions

- **0.1 Money.** Always an integer number of minor units (`amountCents`), never a number with a decimal point. Cap of a
  single value: 1,000,000,000.00. Every division uses the largest remainder method: the parts add up to the total and
  the cents that are left go to the first parts.
- **0.2 Dates.** The day something happens or is due is a date without a time (`YYYY-MM-DD`). Audit stamps
  (`createdAt`) have a time. "Today" and the limits of a month are computed in the person's time zone (default `UTC`).
- **0.3 Month.** A calendar month. A day the month lacks (the 31st in February) falls on its last day.
- **0.4 Owner.** Every piece of data belongs to one person. Someone else's resource answers 404, never 403.
- **0.5 Errors.** A stable code `CONTEXT.REASON` (`NOTE.NOT_FOUND`), never renamed or reused.
- **0.6 Where the rule lives.** Every calculation of this document is done in the API, in a pure function of the
  domain, tested with fixed data. The apps only show the result.
- **0.7 No data, no guess.** A rule without enough data shows nothing instead of estimating.
- **0.8 Sizes.** A name has up to 60 characters, a description up to 140, a note up to 500, unless a rule of a context
  says otherwise.

## 1. Account

- **1.1 Sign-up.** Name, e-mail and password. The e-mail is unique, case-insensitive. A password has 8 characters or
  more (`USER.WEAK_PASSWORD`).
- **1.2 E-mail confirmation.** Signing up sends a link that is valid for 24 hours and can be sent again (once a
  minute, `AUTH.VERIFICATION_RESEND_TOO_SOON`). Without confirming, the person uses the app normally. Every e-mail
  leaves through the `Mailer` port: the log in development, SMTP in production.
- **1.3 Session.** A short access token (15 minutes) and a rotating refresh token (30 days), stored only as a hash.
  Using a token that was already exchanged ends every session of that family (`AUTH.REFRESH_TOKEN_REUSED`). Signing out
  ends the family. The person sees the sessions that are open and can end any of them.
- **1.4 Attempts.** Five wrong passwords for the same e-mail in 15 minutes block new attempts for 15 minutes
  (`AUTH.TOO_MANY_ATTEMPTS`, 429). A wrong password and an unknown e-mail get the same answer.
- **1.5 Password reset.** A single-use link, valid for 1 hour. Changing the password ends every session. The screen
  always answers "if the e-mail has an account, we sent the link".
- **1.6 Export and delete.** The person downloads everything that is theirs (JSON) and can delete the account, which
  deletes everything that belongs to it, after the password is asked again.
- **1.7 Preferences.** The look (theme, accent, density, reduce motion) and the time zone. Absent values keep the
  defaults; a change applies in full or not at all.
- **1.8 Onboarding.** The welcome steps (welcome, profile, appearance, done) can each be completed or skipped; the
  state is `pending` (the "continue setup" card shows), `finished` or `dismissed`, and can be reopened.

## 2. Notes (the example context)

- **2.1 A note.** A title of 1 to 120 characters (trimmed, single spaces) and an optional body of up to 10,000
  characters (blank is no body; line breaks are kept). `NOTE.INVALID_TITLE`, `NOTE.INVALID_BODY`.
- **2.2 Archive.** An archived note leaves the main list, is unpinned and becomes read-only (`NOTE.ARCHIVED`, 409)
  until it is unarchived. Archiving an archived note, or unarchiving one that is not, changes nothing.
- **2.3 Order.** The list shows pinned notes first, then the most recently changed. It can be searched by title or body
  (case-insensitive) and the archive is a list of its own.
- **2.4 Delete.** Deleting a note is for good, archived or not.
