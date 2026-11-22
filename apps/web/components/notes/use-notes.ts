'use client'

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'

import { unwrap } from '@workspace/api-client'
import {
  archiveNote,
  createNote,
  deleteNote,
  listNotes,
  unarchiveNote,
  updateNote,
} from '@workspace/api-client/gen/endpoints/notes'
import type { CreateNoteDto, ListNotesParams, UpdateNoteDto } from '@workspace/api-client/models'
import { toast } from '@workspace/ui/components/toast'

import { queryKeys } from '@/lib/query-keys'
import { useApiMutation } from '@/lib/use-api-mutation'

/**
 * The notes of the signed-in person, as TanStack Query hooks over the generated client
 * (docs/patterns/web/data-fetching.md). Every mutation invalidates `['notes']`: every list and every note that may
 * show the change.
 */
export const useNotes = (params: ListNotesParams) =>
  useQuery({
    queryKey: queryKeys.notes.list(params),
    queryFn: () => unwrap(listNotes(params)),
    // Paging and searching keep the previous page on screen until the next one arrives: nothing jumps.
    placeholderData: keepPreviousData,
  })

const useInvalidateNotes = () => {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all })
}

export const useCreateNote = (options: { onSuccess?: () => void } = {}) => {
  const invalidate = useInvalidateNotes()

  return useApiMutation((body: CreateNoteDto) => unwrap(createNote(body)), {
    successMessage: 'Note saved',
    onSuccess: async () => {
      await invalidate()
      options.onSuccess?.()
    },
  })
}

export const useUpdateNote = (options: { onSuccess?: () => void; successMessage?: string } = {}) => {
  const invalidate = useInvalidateNotes()

  return useApiMutation(({ id, ...body }: UpdateNoteDto & { id: string }) => unwrap(updateNote({ id }, body)), {
    successMessage: options.successMessage,
    onSuccess: async () => {
      await invalidate()
      options.onSuccess?.()
    },
  })
}

export const useArchiveNote = () => {
  const invalidate = useInvalidateNotes()

  return useApiMutation(
    ({ id, archived }: { id: string; archived: boolean }) =>
      unwrap(archived ? archiveNote({ id }) : unarchiveNote({ id })),
    {
      onSuccess: async (_note, { archived }) => {
        await invalidate()
        toast.success(archived ? 'Note archived' : 'Note restored')
      },
    },
  )
}

export const useDeleteNote = (options: { onSuccess?: () => void } = {}) => {
  const invalidate = useInvalidateNotes()

  return useApiMutation((id: string) => unwrap(deleteNote({ id })), {
    successMessage: 'Note deleted',
    onSuccess: async () => {
      await invalidate()
      options.onSuccess?.()
    },
  })
}
