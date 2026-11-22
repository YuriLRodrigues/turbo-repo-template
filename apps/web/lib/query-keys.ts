import type { ListNotesParams } from '@workspace/api-client/models'

/**
 * Every query key of the app, in one place, so a mutation invalidates exactly what it changed. A key is an array
 * whose first item is the resource: `['notes', ...]` invalidates every list and every note at once.
 */
export const queryKeys = {
  me: ['me'] as const,
  preferences: ['me', 'preferences'] as const,
  notes: {
    all: ['notes'] as const,
    list: (params: ListNotesParams) => ['notes', 'list', params] as const,
    detail: (id: string) => ['notes', 'detail', id] as const,
  },
}
