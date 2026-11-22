import { Injectable } from '@nestjs/common'
import { compare, hash } from 'bcryptjs'

import type { HashComparer } from '@domain/identity/applications/cryptography/hash-comparer'
import type { HashGenerator } from '@domain/identity/applications/cryptography/hash-generator'

@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  private static readonly SALT_ROUNDS = 10

  hash(plain: string): Promise<string> {
    return hash(plain, BcryptHasher.SALT_ROUNDS)
  }

  compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed)
  }
}
