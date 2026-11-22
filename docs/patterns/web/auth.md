# Auth in the browser

The API side (tokens, rotation, reuse, cookies) is in [api/auth](../api/auth.md). This is how the web app uses it.

## Where each token lives

| Token         | Where                                                     | Who sees it                  |
| ------------- | --------------------------------------------------------- | ---------------------------- |
| access token  | the memory of `@workspace/api-client` (`http/session.ts`) | the code of this tab, only   |
| refresh token | an httpOnly cookie the API sets on its `/auth` routes     | nobody: the browser sends it |

Nothing is in `localStorage`. A tab that is closed forgets the access token; opening the app turns the cookie back
into one (`restoreSession()`), which is why a reload keeps the person signed in.

## The transport: refresh and retry

Every generated function goes through `customFetch` (`packages/api-client/src/http/custom-fetch.ts`):

1. the base URL (`configureApiClient`, called when `apps/web/lib/api.ts` is first imported), `Authorization: Bearer`
   with the access token, and `credentials: 'include'` so the cookie reaches the API on another origin;
2. a **401 on a private route** renews the session once (`refreshAccessToken`) and repeats the request;
3. when the renewal fails, the session is over: `expireSession()` forgets the token and calls `onSessionExpired`
   (the web app clears the query cache, shows a toast, and the gate sends the person to sign in);
4. the API down is a `503 API.UNREACHABLE` in the API's own error shape, never an exception.

The routes that start, renew or end a session (`/auth/sign-in`, `/auth/sign-up`, `/auth/refresh`, `/auth/sign-out`)
never trigger a refresh.

## Two tabs, one refresh token

The refresh token rotates on every use and the API revokes the whole session when a token is used twice (rule 1.3).
Two tabs that wake up together would present the same cookie at the same time and sign the person out. So every
refresh runs inside one **Web Lock** shared by the tabs of the origin (`navigator.locks.request('app.auth.refresh')`):
the second tab waits, then refreshes with the cookie the first one left. Inside a tab, concurrent callers share one
promise. The specs of `custom-fetch.spec.ts` pin both.

## In React

- `SessionProvider` (`apps/web/components/session/session-provider.tsx`) restores the session on load, reads the
  profile (`GET /me`, query key `['me']`) and offers `signIn`, `signOut`, `status` and `user`.
- `RequireSession` wraps every signed-in screen (`app/(app)/layout.tsx`); without a session it goes to
  `/sign-in/?next=<where the person was>`. `safeNext` only follows paths of this app.
- Sign-in and sign-up call `useLeaveWhenSignedIn(next)`, so a signed-in person never sees them.
- The pages the e-mails point to are a contract with the API: `/verify-email?token=` and `/reset-password?token=`.
  A token works once; the page sends it once (`useRef` guard against the double effect of development).

## Error codes worth handling in place

| Code                          | Where          | What the screen does                |
| ----------------------------- | -------------- | ----------------------------------- |
| `AUTH.INVALID_CREDENTIALS`    | sign-in        | one message under the form          |
| `AUTH.TOO_MANY_ATTEMPTS`      | sign-in        | "wait a few minutes"                |
| `USER.EMAIL_IN_USE`           | sign-up        | error on the e-mail field           |
| `AUTH.PASSWORD_RESET_TOKEN_*` | reset password | "ask for a new link"                |
| `AUTH.VERIFICATION_TOKEN_*`   | verify e-mail  | "ask for a new one in the settings" |
| `USER.WRONG_PASSWORD`         | delete account | error on the password field         |

Everything else is a toast with the API's message and the code (`useApiMutation`).
