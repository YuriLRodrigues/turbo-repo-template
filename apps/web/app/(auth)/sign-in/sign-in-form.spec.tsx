import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@workspace/api-client'

import { renderWithProviders } from '@/test/render'

import { SignInForm } from './sign-in-form'

const router = vi.hoisted(() => ({ replace: vi.fn() }))
const session = vi.hoisted(() => ({ signIn: vi.fn(), status: 'anonymous' as const }))
const search = vi.hoisted(() => ({ next: null as string | null }))

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(search.next ? { next: search.next } : {}),
}))
vi.mock('@/components/session/session-provider', () => ({ useSession: () => session }))

describe('SignInForm', () => {
  beforeEach(() => {
    session.signIn.mockReset()
    router.replace.mockReset()
    search.next = null
  })

  it('checks the fields before calling the API', async () => {
    const { user } = renderWithProviders(<SignInForm />)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
    expect(session.signIn).not.toHaveBeenCalled()
  })

  it('signs in and goes where the person was heading', async () => {
    search.next = '/notes/'
    session.signIn.mockResolvedValue(undefined)
    const { user } = renderWithProviders(<SignInForm />)

    await user.type(screen.getByLabelText('E-mail'), ' jane@example.com ')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/notes/'))
    expect(session.signIn).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'secret123' })
  })

  it('never follows a `next` that leaves the app', async () => {
    search.next = '//elsewhere.example'
    session.signIn.mockResolvedValue(undefined)
    const { user } = renderWithProviders(<SignInForm />)

    await user.type(screen.getByLabelText('E-mail'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'))
  })

  it('says in place that the credentials are wrong', async () => {
    session.signIn.mockRejectedValue(
      new ApiError({ statusCode: 401, code: 'AUTH.INVALID_CREDENTIALS', message: 'Invalid e-mail or password.' }),
    )
    const { user } = renderWithProviders(<SignInForm />)

    await user.type(screen.getByLabelText('E-mail'), 'jane@example.com')
    await user.type(screen.getByLabelText('Password'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('The e-mail or the password is not right.')
    expect(router.replace).not.toHaveBeenCalled()
  })
})
