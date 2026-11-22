'use client'

import type { ReactNode } from 'react'

import { PaletteIcon } from 'lucide-react'

import { IconButton } from '@workspace/ui/components/icon-button'
import { cn } from '@workspace/ui/lib/cn'

import { useShell } from './shell-context'

type PageHeaderProps = {
  /** The one `h1` of the screen. */
  title: ReactNode
  /** A line under the title. */
  description?: ReactNode
  /** Controls of the screen: a search, the main button. Under the title on phones, beside it from 768px. */
  actions?: ReactNode
  className?: string
}

/**
 * The top of every screen. On phones it also carries the way into the appearance control, which the sidebar offers
 * from 768px.
 */
export const PageHeader = ({ title, description, actions, className }: PageHeaderProps) => {
  const { openAppearance } = useShell()

  return (
    <header
      className={cn(
        'mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-4',
        'md:mb-8 md:flex md:items-end md:justify-between md:gap-x-6',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-balance md:text-3xl">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{description}</p>}
      </div>
      <IconButton variant="ghost" label="Appearance" onClick={openAppearance} className="md:hidden">
        <PaletteIcon />
      </IconButton>
      {actions && <div className="col-span-2 flex min-w-0 flex-wrap items-center gap-2 md:shrink-0">{actions}</div>}
    </header>
  )
}
