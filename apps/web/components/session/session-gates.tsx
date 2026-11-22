'use client'

import { type ReactNode, useEffect } from 'react'

import { usePathname, useRouter } from 'next/navigation'

import { Spinner } from '@workspace/ui/components/spinner'

import { useSession } from './session-provider'

/** A whole-screen wait, while the session is being restored. Short: one request on a warm API. */
export const SessionLoading = () => (
  <div role="status" aria-label="Loading" className="grid min-h-svh place-items-center text-muted-foreground">
    <Spinner className="size-6" />
  </div>
)

/** Only `/something` inside this app: `next` never sends anyone to another site. */
export const safeNext = (next: string | null | undefined): string =>
  next && next.startsWith('/') && !next.startsWith('//') ? next : '/'

/**
 * The gate of every signed-in screen: without a session the person goes to sign in, and comes back here after it
 * (`?next=`). A static export has no server to redirect, so this is the redirect.
 */
export const RequireSession = ({ children }: { children: ReactNode }) => {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'anonymous') router.replace(`/sign-in/?next=${encodeURIComponent(pathname)}`)
  }, [status, router, pathname])

  return status === 'authenticated' ? children : <SessionLoading />
}

/** For sign-in and sign-up: a person who is already signed in goes where they were heading. */
export const useLeaveWhenSignedIn = (next: string | null): void => {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') router.replace(safeNext(next))
  }, [status, router, next])
}
