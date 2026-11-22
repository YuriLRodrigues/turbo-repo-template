# Auth

Rules 1.1 to 1.5 of [`docs/business-rules.md`](../../business-rules.md): a short access token, a rotating refresh
token and two ways to carry it. How the web app uses all this is in [web/auth](../web/auth.md).

## The two tokens

|            | Access token                                   | Refresh token                                  |
| ---------- | ---------------------------------------------- | ---------------------------------------------- |
| What it is | a JWT, `{ sub, role, sid }`                    | 32 random bytes, base64url: it means nothing   |
| Lives for  | 15 minutes (`JWT_EXPIRES_IN_SECONDS`)          | 30 days (`REFRESH_TOKEN_TTL_MS`)               |
| Stored     | nowhere                                        | only its SHA-256, in `refresh_tokens`          |
| Checked by | `AuthGuard`: signature and expiry, no database | `RefreshSessionUseCase`: a lookup by hash      |
| Travels in | `Authorization: Bearer ...`                    | a cookie (web) or a header (native), see below |

`sid` is the id of the session, which is the **family** of refresh tokens born from one sign-in. Every refresh
swaps the token for a new one of the same family.

Because the guard never asks the database, an access token keeps working until it expires, also after its session
was revoked or its account deleted. That window (15 minutes at most) is the price of not querying on every request.
What stops at once is the ability to get a new one. Two consequences are handled:

- a write for an account that no longer exists fails on the foreign key to `users`; `HttpErrorFilter` turns exactly
  that into a 401 (`infra/database/drizzle/database-errors.ts`);
- a read for it finds nothing: empty lists, or `USER.NOT_FOUND`.

## Rotation and reuse (rule 1.3)

`POST /auth/refresh` exchanges a refresh token for a new pair. A token works once:

1. unknown or revoked -> `AUTH.REFRESH_TOKEN_INVALID`;
2. already exchanged -> the whole family is revoked and the answer is `AUTH.REFRESH_TOKEN_REUSED`: either the token
   was stolen or the client is broken, and in both cases the session must end;
3. older than 30 days -> `AUTH.REFRESH_TOKEN_EXPIRED`;
4. otherwise it is marked as exchanged and a new pair is issued, in one unit of work.

Step 4 marks the token with one `UPDATE ... WHERE rotated_at IS NULL RETURNING` (`markRotated`). Two requests that
arrive together with the same token cannot both win: the loser falls in case 2.

Signing out revokes the family. Resetting the password revokes every family of the person (rule 1.5).
`GET /me/sessions` lists the families that are still alive and `DELETE /me/sessions/:id` revokes one.

## How the refresh token travels

The client picks the transport on each request; the server never guesses.

| Transport          | Who            | Sign-in and refresh answer                | Refresh and sign-out read it from |
| ------------------ | -------------- | ----------------------------------------- | --------------------------------- |
| `cookie` (default) | the web app    | `Set-Cookie`, and no token in the body    | the cookie                        |
| `token`            | the native app | `refreshToken` in the body, and no cookie | the header `x-refresh-token`      |

A native app sends `x-auth-transport: token` and keeps the token in the secure storage of the device. A request
never reads the other transport: with the header, a cookie that happens to be there is ignored.

The cookie is `app.refresh_token`: `HttpOnly` (JavaScript never sees it), `Path=/auth` (only the auth routes
receive it), `SameSite` from `AUTH_COOKIE_SAME_SITE` (default `lax`) and `Secure` in production or with
`SameSite=None`. Everything is in `presentations/http/auth/refresh-transport.ts`; `SessionResponder` is what the
sign-in and refresh controllers use to answer.

### The web app on another origin

- CORS allows credentials for the origins in `CORS_ORIGINS` only (`http-setup.ts`). The web client must call the
  auth routes with `credentials: 'include'`.
- `CookieOriginGuard` protects the routes that read or write the cookie: a request that says where it comes from
  (`Origin`) must come from one of those origins, or it gets a 403. It is the defence against another site making
  the browser call `/auth/refresh`. The `token` transport carries no cookie and skips the check.
- Web and API on different sites (not just different ports) need `AUTH_COOKIE_SAME_SITE=none`, which forces
  `Secure`, which needs HTTPS.

## Limits

- **Per e-mail (rule 1.4).** Five wrong passwords in 15 minutes block that e-mail for 15 minutes:
  `AUTH.TOO_MANY_ATTEMPTS`, 429, with `details.retryAfterSeconds` and a `Retry-After` header. The failures are rows
  of `sign_in_attempts`, so the count holds across instances. The decision is the pure function
  `signInLockedUntil(failures, now)`. An e-mail without an account is counted the same way and compared against a
  decoy hash, so neither the answer nor its timing says whether the account exists.
- **Per IP.** `PublicThrottlerGuard` limits the routes marked `@Public()` (`PUBLIC_RATE_LIMIT` per
  `PUBLIC_RATE_WINDOW_SECONDS`, per route): 429 `HTTP.TOO_MANY_REQUESTS`. It counts in memory, per instance; behind
  a proxy set `TRUST_PROXY_HOPS` so the IP is the client's.

## Links sent by e-mail (rules 1.2 and 1.5)

Confirmation (24 hours, resent at most once per minute) and password reset (1 hour, single use) are rows of
`user_tokens`: an opaque token, stored as a hash, like the refresh token. A new link replaces the older ones of the
same kind. The link points to the web app, which reads the token and calls the API:

| E-mail         | Link                                      | The web app then calls                          |
| -------------- | ----------------------------------------- | ----------------------------------------------- |
| confirmation   | `${WEB_APP_URL}/verify-email?token=...`   | `POST /auth/verify-email { token }`             |
| password reset | `${WEB_APP_URL}/reset-password?token=...` | `POST /auth/reset-password { token, password }` |

`POST /auth/forgot-password` always answers 204, whether or not the e-mail has an account.

## Routes, roles and the caller

Every route is private unless marked `@Public()`; `@CurrentActor()` gives
`{ id, role }` from the verified token; `@Roles('ADMIN')` restricts by role; ownership is decided in the use case,
by a policy, and someone else's resource answers 404. `@CurrentSessionId()` gives the `sid`.
