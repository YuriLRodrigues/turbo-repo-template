'use client'

import { useEffect, useRef, useState } from 'react'

import { useSearchParams } from 'next/navigation'

import { useQueryClient } from '@tanstack/react-query'
import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react'

import { isApiError, unwrap } from '@workspace/api-client'
import { verifyEmail } from '@workspace/api-client/gen/endpoints/auth'
import { Spinner } from '@workspace/ui/components/spinner'

import { AuthCard, AuthLink } from '@/components/auth/auth-card'
import { useSession } from '@/components/session/session-provider'
import { queryKeys } from '@/lib/query-keys'

type State = { kind: 'checking' } | { kind: 'verified' } | { kind: 'failed'; message: string }

const MESSAGES: Record<string, string> = {
  'AUTH.VERIFICATION_TOKEN_INVALID': 'This link is not valid any more. Ask for a new one in the settings.',
  'AUTH.VERIFICATION_TOKEN_EXPIRED': 'This link expired. Ask for a new one in the settings.',
  'AUTH.EMAIL_ALREADY_VERIFIED': 'This e-mail was already confirmed.',
}

/**
 * The page the confirmation e-mail of rule 1.2 points to (`/verify-email?token=...`, the path is a contract with
 * the API). It sends the token once, as soon as it opens, and says how it went.
 */
export const VerifyEmail = () => {
  const token = useSearchParams().get('token')
  const queryClient = useQueryClient()
  const { status } = useSession()
  const [state, setState] = useState<State>(() =>
    token ? { kind: 'checking' } : { kind: 'failed', message: MESSAGES['AUTH.VERIFICATION_TOKEN_INVALID'] },
  )
  // A token works once: React's development double effect must not send it twice.
  const sent = useRef(false)

  useEffect(() => {
    if (!token || sent.current) return
    sent.current = true
    unwrap(verifyEmail({ token }))
      .then(() => {
        setState({ kind: 'verified' })
        void queryClient.invalidateQueries({ queryKey: queryKeys.me })
      })
      .catch((error: unknown) =>
        setState({
          kind: 'failed',
          message: isApiError(error) ? (MESSAGES[error.code] ?? error.message) : 'Something went wrong. Try again.',
        }),
      )
  }, [token, queryClient])

  const next =
    status === 'authenticated' ? { href: '/', label: 'Go to the app' } : { href: '/sign-in/', label: 'Sign in' }

  if (state.kind === 'checking') {
    return (
      <AuthCard title="Confirming your e-mail" description="One moment.">
        <Spinner className="size-6 text-muted-foreground" />
      </AuthCard>
    )
  }

  return state.kind === 'verified' ? (
    <AuthCard
      title="Your e-mail is confirmed"
      description="Thank you."
      footer={<AuthLink href={next.href}>{next.label}</AuthLink>}
    >
      <CircleCheckIcon aria-hidden className="size-8 text-success-text" />
    </AuthCard>
  ) : (
    <AuthCard
      title="The e-mail was not confirmed"
      description={state.message}
      footer={<AuthLink href={next.href}>{next.label}</AuthLink>}
    >
      <CircleAlertIcon aria-hidden className="size-8 text-destructive-text" />
    </AuthCard>
  )
}
