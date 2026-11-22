import type { HashComparer } from '@domain/identity/applications/cryptography/hash-comparer'
import type { HashGenerator } from '@domain/identity/applications/cryptography/hash-generator'

/** Deterministic and instant: `hash('secret123') === 'hashed:secret123'`. */
export class FakeHasher implements HashGenerator, HashComparer {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`
  }
}
