import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

type EmptyStateProps = {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** What to do about it: usually the button that creates the first item. */
  action?: ReactNode
  className?: string
}

/** What a list shows when there is nothing in it: what would be here, and the way to start. Never a blank area. */
export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
    {icon && (
      <span
        aria-hidden
        className="grid size-12 place-items-center rounded-full well text-muted-foreground [&_svg]:size-5"
      >
        {icon}
      </span>
    )}
    <div className="max-w-sm">
      <p className="font-display text-base font-semibold">{title}</p>
      {description && <p className="mt-1 text-sm text-pretty text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
)
