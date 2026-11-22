/**
 * Rule 1.6: a person can download everything that is theirs and delete their account. Identity does not know what
 * the other bounded contexts keep, so each of them implements this small port for its own data:
 *
 * - `export` returns that context's part of the document, as plain JSON values (dates as ISO text);
 * - `erase` deletes everything that context keeps for the person.
 *
 * A new context adds its contributor to the list in `IdentityHttpModule`; the two use cases
 * do not change.
 */
export abstract class UserDataContributor {
  /** The key of this part in the exported document: `identity`, `notes`. */
  abstract readonly section: string
  abstract export(userId: string): Promise<Record<string, unknown>>
  abstract erase(userId: string): Promise<void>
}

/**
 * Every contributor of the app. The order is the order of the document and the order of dependency: a context
 * comes after the ones it points to (a context that references users comes after identity). Erasing walks the list backwards, so
 * what points to something is deleted before it.
 */
export class UserDataContributors {
  constructor(readonly inOrder: readonly UserDataContributor[]) {}

  get inEraseOrder(): UserDataContributor[] {
    return [...this.inOrder].reverse()
  }
}

/** What `GET /me/export` answers. `version` changes when the shape of a section changes. */
export type UserDataExport = {
  format: 'app.export'
  version: 1
  exportedAt: string
  data: Record<string, Record<string, unknown>>
}
