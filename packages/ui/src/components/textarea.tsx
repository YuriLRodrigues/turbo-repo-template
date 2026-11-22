import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

/** A text field of several lines, the same well as `Input`. It grows with its content up to `max-h-*` (then scrolls). */
export const Textarea = ({ className, rows = 4, ...props }: ComponentProps<'textarea'>) => (
  <textarea
    rows={rows}
    className={cn(
      'field-sizing-content min-h-24 w-full min-w-0 resize-none rounded-(--radius-control) well px-3 py-2.5 text-base text-foreground outline-none sm:text-sm',
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
