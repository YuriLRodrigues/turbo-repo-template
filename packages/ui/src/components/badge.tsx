import type { ComponentProps, ReactNode } from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/cn'

const badgeVariants = cva(
  'inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-xs leading-none font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-muted-foreground',
        primary: 'bg-primary-soft text-primary-text',
        success: 'bg-success-soft text-success-text',
        warning: 'bg-warning-soft text-warning-text',
        destructive: 'bg-destructive-soft text-destructive-text',
        /* An outline for a fact that is not a status: "Pinned", "Draft". */
        outline: 'text-muted-foreground inset-ring inset-ring-border-strong',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & {
    icon?: ReactNode
  }

/** A short label attached to something: a status, a fact, a count. Never the only way a status is told. */
export const Badge = ({ tone, icon, className, children, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ tone }), className)} {...props}>
    {icon}
    {children}
  </span>
)
