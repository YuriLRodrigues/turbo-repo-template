import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

/**
 * A text field: a well in the surface that shows the ring when it has the focus. 16px text on phones, so iOS does not
 * zoom the page when the field is tapped.
 */
export const Input = ({ className, type = 'text', ...props }: ComponentProps<'input'>) => (
  <input
    type={type}
    className={cn(
      'h-10 w-full min-w-0 rounded-(--radius-control) well px-3 text-base text-foreground outline-none sm:text-sm',
      'transition-[box-shadow,background-color] duration-200 ease-out',
      'placeholder:text-muted-foreground/80 hover:bg-muted-hover',
      'focus-visible:bg-transparent focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] focus-visible:outline-none',
      'aria-invalid:shadow-[inset_0_0_0_2px_var(--destructive)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
)

/** The label of a field. Always visible: a placeholder is an example, not a name. */
export const Label = ({ className, ...props }: ComponentProps<'label'>) => (
  <label className={cn('text-sm leading-none font-medium text-foreground select-none', className)} {...props} />
)
