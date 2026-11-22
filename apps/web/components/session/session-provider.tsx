'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'

import { useQuery, useQueryClient } from '@tanstack/react-query'

import { clearSession, hasSession, restoreSession, setSession, subscribeSession, unwrap } from '@workspace/api-client'
import { signIn as signInRequest, signOut as signOutRequest } from '@workspace/api-client/gen/endpoints/auth'
import { getMe } from '@workspace/api-client/gen/endpoints/me'
import type { SignInDto, UserResponseDto } from '@workspace/api-client/models'
import { toast } from '@workspace/ui/components/toast'

import { onSessionExpired } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

type SessionContextValue = {
  status: SessionStatus
  /** The signed-in person, once `status` is `authenticated`. */
  user: UserResponseDto | null
  /** Throws an `ApiError` (`AUTH.INVALID_CREDENTIALS`, `AUTH.TOO_MANY_ATTEMPTS`...) when it does not work. */
  signIn: (credentials: SignInDto) => Promise<void>
  /** Ends the session on the API and forgets everything this tab knew. Never fails. */
  signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export const useSession = (): SessionContextValue => {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside <SessionProvider>')

  return session
}

/**
 * Who is using the app (docs/patterns/web/auth.md). On load it turns the refresh cookie into an access token
 * (`restoreSession`), then reads the profile (`GET /me`). The access token lives in the memory of
 * `@workspace/api-client`; this provider only mirrors whether there is one.
 *
 * When the API says the session is over (a refresh that fails), every cached answer is dropped and the person is
 * told: the guard of the signed-in screens sends them to sign in.
 */
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()
  const signedIn = useSyncExternalStore(subscribeSession, hasSession, () => false)
  const [restored, setRestored] = useState(false)

  useEffect(
    () =>
      onSessionExpired(() => {
        queryClient.clear()
        toast.info('Your session ended. Sign in again to continue.')
      }),
    [queryClient],
  )

  useEffect(() => {
    void restoreSession().finally(() => setRestored(true))
  }, [])

  const me = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => unwrap(getMe()),
    enabled: signedIn,
    staleTime: 60_000,
  })

  // The account is gone (deleted elsewhere): the token is worth nothing.
  useEffect(() => {
    if (me.isError) clearSession()
  }, [me.isError])

  const signIn = useCallback(
    async (credentials: SignInDto) => {
      setSession(await unwrap(signInRequest(credentials)))
      await queryClient.fetchQuery({ queryKey: queryKeys.me, queryFn: () => unwrap(getMe()) })
    },
    [queryClient],
  )

  const signOut = useCallback(async () => {
    await signOutRequest().catch(() => undefined)
    clearSession()
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<SessionContextValue>(() => {
    const status: SessionStatus = !restored
      ? 'loading'
      : !signedIn
        ? 'anonymous'
        : me.data
          ? 'authenticated'
          : me.isError
            ? 'anonymous'
            : 'loading'

    return { status, user: status === 'authenticated' ? (me.data ?? null) : null, signIn, signOut }
  }, [restored, signedIn, me.data, me.isError, signIn, signOut])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
