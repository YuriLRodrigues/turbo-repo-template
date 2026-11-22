import { Suspense } from 'react'

import type { Metadata } from 'next'

import { SessionLoading } from '@/components/session/session-gates'

import { VerifyEmail } from './verify-email'

export const metadata: Metadata = { title: 'Confirm your e-mail' }

// The token comes in the query string (`?token=`), which a static page only knows in the browser.
const VerifyEmailPage = () => (
  <Suspense fallback={<SessionLoading />}>
    <VerifyEmail />
  </Suspense>
)

export default VerifyEmailPage
