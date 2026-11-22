import type { AccessTokenPayload, Encrypter } from '@domain/identity/applications/cryptography/encrypter'

/** The "token" is the JSON payload, so a test can read what would have been signed. */
export class FakeEncrypter implements Encrypter {
  async encrypt(payload: AccessTokenPayload): Promise<string> {
    return JSON.stringify(payload)
  }
}
