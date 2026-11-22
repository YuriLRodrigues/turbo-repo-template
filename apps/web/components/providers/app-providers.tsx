'use client'

import { type ReactNode, useState } from 'react'

import { QueryClientProvider } from '@tanstack/react-query'

import { useFollowAppearance } from '@workspace/ui/appearance'
import { TooltipProvider } from '@workspace/ui/components/tooltip'

import { SessionProvider } from '@/components/session/session-provider'
import { makeQueryClient } from '@/lib/query-client'

/** Everything the screens need around them: the query cache, the session, the tooltips and the look. */
export const AppProviders = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(makeQueryClient)
  useFollowAppearance()

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
