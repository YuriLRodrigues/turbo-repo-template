import type { UserTokensRepository } from '@domain/identity/applications/repositories/user-tokens.repository'
import type { UserToken } from '@domain/identity/enterprise/entities/user-token.entity'
import type { UserTokenKind } from '@domain/identity/enterprise/user-token-kind'

export class InMemoryUserTokensRepository implements UserTokensRepository {
  items: UserToken[] = []

  async create(token: UserToken): Promise<void> {
    this.items.push(token)
  }

  async findByHash(kind: UserTokenKind, tokenHash: string): Promise<UserToken | null> {
    return this.items.find((token) => token.kind === kind && token.tokenHash === tokenHash) ?? null
  }

  async findLatest(userId: string, kind: UserTokenKind): Promise<UserToken | null> {
    const [latest] = this.items
      .filter((token) => token.userId.toString() === userId && token.kind === kind)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return latest ?? null
  }

  async save(token: UserToken): Promise<void> {
    this.items = this.items.map((current) => (current.id.equals(token.id) ? token : current))
  }

  async invalidateAll(userId: string, kind: UserTokenKind, at: Date): Promise<void> {
    for (const token of this.items) {
      if (token.userId.toString() === userId && token.kind === kind) token.use(at)
    }
  }

  async deleteAllOfUser(userId: string): Promise<void> {
    this.items = this.items.filter((token) => token.userId.toString() !== userId)
  }
}
