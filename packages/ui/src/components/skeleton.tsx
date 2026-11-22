import type { ComponentProps } from 'react'

import { cn } from '../lib/cn'

/**
 * The shape of something that is still loading: a block in the tone of a well with a light that runs across it.
 * Give it the size and the radius of what it stands for (`h-9 w-40 rounded-full`). With reduced motion the light
 * stops and the block stays.
 */
export const Skeleton = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    aria-hidden
    className={cn(
      'animate-shimmer rounded-xl bg-(--skeleton)',
      'bg-[linear-gradient(100deg,transparent_30%,var(--skeleton-shine)_50%,transparent_70%)] bg-[length:200%_100%] bg-no-repeat',
      className,
    )}
    {...props}
  />
)
