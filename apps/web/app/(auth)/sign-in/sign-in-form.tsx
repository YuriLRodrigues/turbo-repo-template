'use client'

import { useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { isApiError } from '@workspace/api-client'
import { Button } from '@workspace/ui/components/button'
import { FieldError } from '@workspace/ui/components/field'

import { AuthCard, AuthLink } from '@/components/auth/auth-card'
import { signInSchema } from '@/components/auth/auth-schemas'
import { ControlledInput } from '@/components/form/controlled-fields'
import { useAppForm } from '@/components/form/use-app-form'
import { safeNext, useLeaveWhenSignedIn } from '@/components/session/session-gates'
import { useSession } from '@/components/session/session-provider'

/** The errors this form says in place, under the fields; anything else is a toast. */
const INLINE_ERRORS: Record<string, string> = {
  'AUTH.INVALID_CREDENTIALS': 'The e-mail or the password is not right.',
  'AUTH.TOO_MANY_ATTEMPTS': 'Too many attempts. Wait a few minutes and try again.',
}

export const SignInForm = () => {
  const router = useRouter()
  const next = useSearchParams().get('next')
  const { signIn } = useSession()
  const [error, setError] = useState<string | null>(null)
  const form = useAppForm(signInSchema, { defaultValues: { email: '', password: '' } })
  useLeaveWhenSignedIn(next)

  const submit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      await signIn(values)
      router.replace(safeNext(next))
    } catch (cause) {
      setError(
        isApiError(cause)
          ? (INLINE_ERRORS[cause.code] ?? cause.message)
          : 'Something went wrong. Try again in a moment.',
      )
    }
  })

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back."
      footer={
        <>
          No account yet? <AuthLink href="/sign-up/">Sign up</AuthLink>
        </>
      }
    >
      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <ControlledInput control={form.control} name="email" label="E-mail" type="email" autoComplete="email" />
        <ControlledInput
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />
        <FieldError>{error}</FieldError>
        <Button type="submit" loading={form.formState.isSubmitting} className="mt-1">
          Sign in
        </Button>
        <AuthLink href="/forgot-password/">Forgot your password?</AuthLink>
      </form>
    </AuthCard>
  )
}
