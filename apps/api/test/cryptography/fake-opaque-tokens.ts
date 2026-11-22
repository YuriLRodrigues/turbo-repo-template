import type { IssuedToken, OpaqueTokens } from '@domain/identity/applications/cryptography/opaque-tokens'

/** Predictable tokens: `token-1`, `token-2`... and `hash('token-1') === 'hash:token-1'`. */
export class FakeOpaqueTokens implements OpaqueTokens {
  private issued = 0

  issue(): IssuedToken {
    this.issued += 1
    const token = `token-${this.issued}`

    return { token, hash: this.hash(token) }
  }

  hash(token: string): string {
    return `hash:${token}`
  }
}
