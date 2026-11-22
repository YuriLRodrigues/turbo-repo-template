/** The links the app sends by e-mail: confirm the address (rule 1.2) and choose a new password (rule 1.5). */
export const userTokenKinds = ['email_verification', 'password_reset'] as const

export type UserTokenKind = (typeof userTokenKinds)[number]
