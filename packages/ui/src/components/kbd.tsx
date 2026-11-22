import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

/**
 * A key of the keyboard, as it is written in a shortcut: `<Kbd>Ctrl</Kbd><Kbd>B</Kbd>`. It takes the color of the
 * text around it, so it reads on a surface and inside a tooltip alike.
 */
export const Kbd = ({ className, ...props }: ComponentProps<'kbd'>) => (
  <kbd
    className={cn(
      'inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-current/15 px-1.5 font-sans text-[0.6875rem] leading-none font-semibold',
      className,
    )}
    {...props}
  />
)
