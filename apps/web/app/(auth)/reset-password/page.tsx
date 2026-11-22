import { Suspense } from 'react'

import type { Metadata } from 'next'

import { SessionLoading } from '@/components/session/session-gates'

import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = { title: 'Choose a new password' }

// The token comes in the query string (`?token=`), which a static page only knows in the browser.
const ResetPasswordPage = () => (
  <Suspense fallback={<SessionLoading />}>
    <ResetPasswordForm />
  </Suspense>
)

export default ResetPasswordPage
