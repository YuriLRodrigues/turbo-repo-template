export const roles = ['USER', 'ADMIN'] as const

export type Role = (typeof roles)[number]

/** Who is performing a use case. Built by the HTTP layer from the access token, never from the request body. */
export interface Actor {
  id: string
  role: Role
}

export const isAdmin = (actor: Actor): boolean => actor.role === 'ADMIN'
