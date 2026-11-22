/**
 * Builds the addresses that go inside the e-mails. They point to pages of the web app, which read the token from
 * the query string and call the API (`POST /auth/verify-email`, `POST /auth/reset-password`).
 */
export abstract class AccountLinks {
  /** The name of the product the links lead to, said in the e-mails (`APP_NAME`). */
  abstract readonly appName: string
  abstract emailVerification(token: string): string
  abstract passwordReset(token: string): string
}
