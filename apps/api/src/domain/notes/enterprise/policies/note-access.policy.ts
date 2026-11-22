import type { Actor } from '@core/auth/actor'

import type { Note } from '../entities/note.entity'

/** Rule 0.4: a note is seen and changed by its owner only. Anyone else gets a 404, never a 403. */
export const canAccessNote = (actor: Actor, note: Note): boolean => note.ownerId.toString() === actor.id
