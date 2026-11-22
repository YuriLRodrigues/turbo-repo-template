'use client'

import { useState } from 'react'

import { MailCheckIcon } from 'lucide-react'

import { unwrap } from '@workspace/api-client'
import { requestPasswordReset } from '@workspace/api-client/gen/endpoints/auth'
import { Button } from '@workspace/ui/components/button'

import { AuthCard, AuthLink } from '@/components/auth/auth-card'
import { forgotPasswordSchema } from '@/components/auth/auth-schemas'
import { ControlledInput } from '@/components/form/controlled-fields'
import { useAppForm } from '@/components/form/use-app-form'
import { useApiMutation } from '@/lib/use-api-mutation'

/**
 * Asks for the link that resets the password (rule 1.5 of the API). The answer is the same whether the e-mail has
 * an account or not: nobody learns from this screen who is registered.
 */
export const ForgotPasswordForm = () => {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useAppForm(forgotPasswordSchema, { defaultValues: { email: '' } })
  const request = useApiMutation((email: string) => unwrap(requestPasswordReset({ email })), {
    onSuccess: (_data, email) => setSentTo(email),
  })

  if (sentTo) {
    return (
      <AuthCard
        title="Check your inbox"
        description={`If ${sentTo} has an account, we sent it a link to choose a new password. It is valid for 1 hour.`}
        footer={<AuthLink href="/sign-in/">Back to sign in</AuthLink>}
      >
        <MailCheckIcon aria-hidden className="size-8 text-primary-text" />
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your e-mail and we will send you a link to choose a new one."
      footer={<AuthLink href="/sign-in/">Back to sign in</AuthLink>}
    >
      <form
        noValidate
        onSubmit={(event) => void form.handleSubmit(({ email }) => request.mutate(email))(event)}
        className="flex flex-col gap-4"
      >
        <ControlledInput control={form.control} name="email" label="E-mail" type="email" autoComplete="email" />
        <Button type="submit" loading={request.isPending} className="mt-1">
          Send the link
        </Button>
      </form>
    </AuthCard>
  )
}
