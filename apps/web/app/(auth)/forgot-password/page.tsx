import type { Metadata } from 'next'

import { ForgotPasswordForm } from './forgot-password-form'

export const metadata: Metadata = { title: 'Forgot your password' }

const ForgotPasswordPage = () => <ForgotPasswordForm />

export default ForgotPasswordPage
