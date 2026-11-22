/** The numbers of section 1 of the business rules (docs/business-rules.md), in one place. */

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Rule 1.1 */
export const PASSWORD_MIN_LENGTH = 8

/** Rule 1.2: the confirmation link is valid for 24 hours and can be sent again once per minute. */
export const EMAIL_VERIFICATION_TTL_MS = 24 * HOUR
export const EMAIL_RESEND_INTERVAL_MS = MINUTE

/** Rule 1.3: the refresh token rotates and lasts 30 days. */
export const REFRESH_TOKEN_TTL_MS = 30 * DAY

/** Rule 1.4: five wrong passwords for the same e-mail in 15 minutes block new attempts for 15 minutes. */
export const SIGN_IN_MAX_FAILURES = 5
export const SIGN_IN_FAILURE_WINDOW_MS = 15 * MINUTE
export const SIGN_IN_LOCK_MS = 15 * MINUTE

/** Rule 1.5: the password link is single use and valid for 1 hour. */
export const PASSWORD_RESET_TTL_MS = HOUR
