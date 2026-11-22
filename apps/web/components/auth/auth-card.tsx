import type { ReactNode } from 'react'

import Link from 'next/link'

import { Brand } from '@/components/shell/brand'

type AuthCardProps = {
  title: string
  description?: ReactNode
  children: ReactNode
  /** Under the card: the way to the other screens of the flow ("No account yet? Sign up"). */
  footer?: ReactNode
}

/** The frame of every screen of the sign-in flow: the brand, one card, and the links around it. */
export const AuthCard = ({ title, description, children, footer }: AuthCardProps) => (
  <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-10">
    <Link href="/" aria-label="Home">
      <Brand />
    </Link>
    <section className="w-full max-w-sm rounded-(--radius-sheet) surface p-6 sm:p-8">
      <h1 className="font-display text-xl font-semibold tracking-[-0.01em]">{title}</h1>
      {description && <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
    {footer && <p className="text-sm text-muted-foreground">{footer}</p>}
  </main>
)

/** A link of the flow, in the accent. */
export const AuthLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="font-medium text-primary-text underline-offset-4 hover:underline">
    {children}
  </Link>
)
