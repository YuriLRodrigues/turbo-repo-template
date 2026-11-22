import { PASSWORD_MIN_LENGTH } from '../identity-rules'

/** Rule 1.1: a password has 8 characters or more. Nothing else is asked of it. */
export function isAcceptablePassword(password: string): boolean {
  return [...password].length >= PASSWORD_MIN_LENGTH
}
