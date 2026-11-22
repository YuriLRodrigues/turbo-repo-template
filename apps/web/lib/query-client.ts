import { QueryClient } from '@tanstack/react-query'

/** Defaults for the whole app. Every read is per person, so nothing is shared between sessions. */
export const makeQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // An API error is an answer, not a network blip: retrying a 404 or a 422 only delays the message.
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
