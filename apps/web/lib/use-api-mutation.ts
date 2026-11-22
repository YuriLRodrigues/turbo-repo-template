'use client'

import { useMutation } from '@tanstack/react-query'

import { type ApiError, toApiError } from '@workspace/api-client'
import { toast } from '@workspace/ui/components/toast'

type ApiMutationOptions<TInput, TData> = {
  /** Shown as a success toast. */
  successMessage?: string
  onSuccess?: (data: TData, input: TInput) => void | Promise<void>
  onError?: (error: ApiError, input: TInput) => void
  /** Error codes the screen already handles itself (shows inline, for example): no toast for them. */
  silentCodes?: readonly string[]
}

/**
 * A call to the API that changes something, through TanStack Query (docs/patterns/web/data-fetching.md).
 *
 * `request` is a generated function wrapped in `unwrap`, so a failure is an `ApiError` (`mutation.error.code` is the
 * API's stable code) and a toast with the API's `message`; the `code` goes in the toast description, so a screenshot
 * of the error says exactly which one it was.
 *
 *   const archive = useApiMutation((id: string) => unwrap(archiveNote({ id })), {
 *     successMessage: 'Note archived',
 *     onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
 *   })
 */
export const useApiMutation = <TInput = void, TData = unknown>(
  request: (input: TInput) => Promise<TData>,
  options: ApiMutationOptions<TInput, TData> = {},
) =>
  useMutation<TData, ApiError, TInput>({
    mutationFn: async (input) => {
      try {
        return await request(input)
      } catch (error) {
        throw toApiError(error)
      }
    },
    onSuccess: async (data, input) => {
      if (options.successMessage) toast.success(options.successMessage)
      await options.onSuccess?.(data, input)
    },
    onError: (error, input) => {
      if (!options.silentCodes?.includes(error.code)) toast.error(error.message, { description: error.code })
      options.onError?.(error, input)
    },
  })
