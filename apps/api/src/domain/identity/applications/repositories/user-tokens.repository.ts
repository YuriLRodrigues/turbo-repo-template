import type { UserToken } from '../../enterprise/entities/user-token.entity'
import type { UserTokenKind } from '../../enterprise/user-token-kind'

/** The single-use links of rules 1.2 and 1.5, looked up by the hash of the token. */
export abstract class UserTokensRepository {
  abstract create(token: UserToken): Promise<void>
  abstract findByHash(kind: UserTokenKind, tokenHash: string): Promise<UserToken | null>
  /** The last link of this kind that was sent to the person, used or not. */
  abstract findLatest(userId: string, kind: UserTokenKind): Promise<UserToken | null>
  abstract save(token: UserToken): Promise<void>
  /** A newer link replaces the older ones: the unused links of this kind stop working. */
  abstract invalidateAll(userId: string, kind: UserTokenKind, at: Date): Promise<void>
  /** Rule 1.6. */
  abstract deleteAllOfUser(userId: string): Promise<void>
}
