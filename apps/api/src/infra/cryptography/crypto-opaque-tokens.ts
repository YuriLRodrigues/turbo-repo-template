import { createHash, randomBytes } from 'node:crypto'

import { Injectable } from '@nestjs/common'

import type { IssuedToken, OpaqueTokens } from '@domain/identity/applications/cryptography/opaque-tokens'

/** 256 random bits per token, in URL-safe text (43 characters). */
const TOKEN_BYTES = 32

/**
 * Tokens come from the operating system's random source and are stored as SHA-256. A plain, fast hash is right
 * here (and bcrypt is not): the token is random, not a password someone chose, and it must be found by its hash.
 */
@Injectable()
export class CryptoOpaqueTokens implements OpaqueTokens {
  issue(): IssuedToken {
    const token = randomBytes(TOKEN_BYTES).toString('base64url')

    return { token, hash: this.hash(token) }
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}
