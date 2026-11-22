'use client'

import { useState } from 'react'

import { useSearchParams } from 'next/navigation'

import { CircleCheckIcon } from 'lucide-react'

import { unwrap } from '@workspace/api-client'
import { resetPassword } from '@workspace/api-client/gen/endpoints/auth'
import { Button } from '@workspace/ui/components/button'
import { FieldError } from '@workspace/ui/components/field'

import { AuthCard, AuthLink } from '@/components/auth/auth-card'
import { PASSWORD_MIN_LENGTH, resetPasswordSchema } from '@/components/auth/auth-schemas'
import { ControlledInput } from '@/components/form/controlled-fields'
import { useAppForm } from '@/components/form/use-app-form'
import { useApiMutation } from '@/lib/use-api-mutation'

const LINK_ERRORS: Record<string, string> = {
  'AUTH.PASSWORD_RESET_TOKEN_INVALID': 'This link is not valid any more. Ask for a new one.',
  'AUTH.PASSWORD_RESET_TOKEN_EXPIRED': 'This link expired. Ask for a new one.',
}

/**
 * The page the e-mail of rule 1.5 points to (`/reset-password?token=...`, the path is a contract with the API).
 * Changing the password ends every session of the account, so the person signs in again afterwards.
 */
export const ResetPasswordForm = () => {
  const token = useSearchParams().get('token') ?? ''
  const [done, setDone] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(
    token ? null : LINK_ERRORS['AUTH.PASSWORD_RESET_TOKEN_INVALID'],
  )
  const form = useAppForm(resetPasswordSchema, { defaultValues: { password: '', confirmation: '' } })
  const reset = useApiMutation((password: string) => unwrap(resetPassword({ token, password })), {
    silentCodes: Object.keys(LINK_ERRORS),
    onSuccess: () => setDone(true),
    onError: (error) => setLinkError(LINK_ERRORS[error.code] ?? null),
  })

  if (done) {
    return (
      <AuthCard
        title="Your password was changed"
        description="Every session was closed. Sign in with the new password."
        footer={<AuthLink href="/sign-in/">Sign in</AuthLink>}
      >
        <CircleCheckIcon aria-hidden className="size-8 text-success-text" />
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Choose a new password"
      description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
      footer={<AuthLink href="/forgot-password/">Ask for a new link</AuthLink>}
    >
      <form
        noValidate
        onSubmit={(event) => void form.handleSubmit(({ password }) => reset.mutate(password))(event)}
        className="flex flex-col gap-4"
      >
        <ControlledInput
          control={form.control}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
        />
        <ControlledInput
          control={form.control}
          name="confirmation"
          label="The same password again"
          type="password"
          autoComplete="new-password"
        />
        <FieldError>{linkError}</FieldError>
        <Button type="submit" loading={reset.isPending} disabled={!token} className="mt-1">
          Change the password
        </Button>
      </form>
    </AuthCard>
  )
}
