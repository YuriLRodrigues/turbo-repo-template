import type { Role } from '@core/auth/actor'

export type AccessTokenPayload = {
  sub: string
  role: Role
  /** The session (the refresh token family) this access token was issued in. */
  sid: string
}

/** Issues the access token. The domain only knows the payload, never the algorithm or the secret. */
export abstract class Encrypter {
  abstract encrypt(payload: AccessTokenPayload): Promise<string>
}
