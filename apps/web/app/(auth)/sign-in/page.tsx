import { Suspense } from 'react'

import type { Metadata } from 'next'

import { SessionLoading } from '@/components/session/session-gates'

import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Sign in' }

// `useSearchParams` (the `?next=`) needs a Suspense boundary in a static export: the page is built without a query.
const SignInPage = () => (
  <Suspense fallback={<SessionLoading />}>
    <SignInForm />
  </Suspense>
)

export default SignInPage
