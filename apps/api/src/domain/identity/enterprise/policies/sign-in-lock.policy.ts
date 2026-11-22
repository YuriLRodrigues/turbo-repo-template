import { SIGN_IN_FAILURE_WINDOW_MS, SIGN_IN_LOCK_MS, SIGN_IN_MAX_FAILURES } from '../identity-rules'

/**
 * Rule 1.4. Given the wrong passwords recorded for one e-mail, says until when new attempts are blocked, or `null`
 * when they are not. Five failures inside 15 minutes block for 15 minutes counted from the fifth one.
 *
 * An attempt made while blocked is refused before the password is looked at and is not recorded, so a block always
 * ends 15 minutes after it started, however much someone insists.
 */
export function signInLockedUntil(failures: readonly Date[], now: Date): Date | null {
  const times = failures.map((failure) => failure.getTime()).sort((a, b) => a - b)
  let lockedUntil = 0

  for (let last = SIGN_IN_MAX_FAILURES - 1; last < times.length; last++) {
    const first = last - (SIGN_IN_MAX_FAILURES - 1)
    if (times[last] - times[first] <= SIGN_IN_FAILURE_WINDOW_MS) {
      lockedUntil = Math.max(lockedUntil, times[last] + SIGN_IN_LOCK_MS)
    }
  }

  return lockedUntil > now.getTime() ? new Date(lockedUntil) : null
}

/** How far back the failures matter: a block can come from failures up to a window plus a lock ago. */
export const SIGN_IN_HISTORY_MS = SIGN_IN_FAILURE_WINDOW_MS + SIGN_IN_LOCK_MS
