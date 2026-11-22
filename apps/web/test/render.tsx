import type { ReactElement, ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Renders a client component with what it needs from the app (TanStack Query) and returns a `user` to interact
 * with it:
 *
 *   const { user } = renderWithProviders(<SignInForm />)
 *   await user.type(screen.getByLabelText('E-mail'), 'jane@example.com')
 */
export const renderWithProviders = (ui: ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { user: userEvent.setup(), ...render(ui, { wrapper }) }
}
