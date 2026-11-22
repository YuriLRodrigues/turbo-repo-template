export type IssuedToken = {
  /** What the person receives (in the cookie, the response or the e-mail link). Never stored. */
  token: string
  /** What the database keeps in its place. */
  hash: string
}

/**
 * Random tokens that mean nothing by themselves: refresh tokens (rule 1.3) and the links sent by e-mail (rules 1.2
 * and 1.5). They carry enough entropy to be stored as a plain, unsalted hash and looked up by it.
 */
export abstract class OpaqueTokens {
  abstract issue(): IssuedToken
  abstract hash(token: string): string
}
