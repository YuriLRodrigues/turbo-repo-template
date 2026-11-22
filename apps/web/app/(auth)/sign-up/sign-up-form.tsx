'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { isApiError, unwrap } from '@workspace/api-client'
import { signUp } from '@workspace/api-client/gen/endpoints/auth'
import { Button } from '@workspace/ui/components/button'
import { FieldError } from '@workspace/ui/components/field'
import { toast } from '@workspace/ui/components/toast'

import { AuthCard, AuthLink } from '@/components/auth/auth-card'
import { PASSWORD_MIN_LENGTH, signUpSchema } from '@/components/auth/auth-schemas'
import { ControlledInput } from '@/components/form/controlled-fields'
import { useAppForm } from '@/components/form/use-app-form'
import { useLeaveWhenSignedIn } from '@/components/session/session-gates'
import { useSession } from '@/components/session/session-provider'

/**
 * Creates the account (rule 1.1 of the API, which also sends the confirmation e-mail) and signs in right away: the
 * app can be used before the e-mail is confirmed.
 */
export const SignUpForm = () => {
  const router = useRouter()
  const { signIn } = useSession()
  const [error, setError] = useState<string | null>(null)
  const form = useAppForm(signUpSchema, { defaultValues: { name: '', email: '', password: '' } })
  useLeaveWhenSignedIn(null)

  const submit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      await unwrap(signUp(values))
      await signIn({ email: values.email, password: values.password })
      toast.success('Welcome! We sent you a link to confirm your e-mail.')
      router.replace('/')
    } catch (cause) {
      if (isApiError(cause) && cause.code === 'USER.EMAIL_IN_USE') {
        form.setError('email', { message: 'There is already an account with this e-mail.' })
      } else {
        setError(isApiError(cause) ? cause.message : 'Something went wrong. Try again in a moment.')
      }
    }
  })

  return (
    <AuthCard
      title="Create your account"
      description="A name, an e-mail and a password."
      footer={
        <>
          Already have an account? <AuthLink href="/sign-in/">Sign in</AuthLink>
        </>
      }
    >
      <form noValidate onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
        <ControlledInput control={form.control} name="name" label="Name" autoComplete="name" />
        <ControlledInput control={form.control} name="email" label="E-mail" type="email" autoComplete="email" />
        <ControlledInput
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        />
        <FieldError>{error}</FieldError>
        <Button type="submit" loading={form.formState.isSubmitting} className="mt-1">
          Create account
        </Button>
      </form>
    </AuthCard>
  )
}
