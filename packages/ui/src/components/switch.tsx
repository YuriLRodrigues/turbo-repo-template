'use client'

import type { ComponentProps } from 'react'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'

import { cn } from '../lib/cn'

/**
 * On or off, applied at once. The thumb slides with a spring and stretches a little while pressed.
 * Label it with an enclosing `<label>` or with `aria-labelledby`.
 */
export const Switch = ({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) => (
  <SwitchPrimitive.Root
    className={cn(
      'group/switch relative inline-flex h-8 w-[3.25rem] shrink-0 cursor-pointer items-center rounded-full well p-0.5',
      'transition-[background-color,box-shadow] duration-300 ease-out',
      'data-checked:bg-primary data-checked:shadow-[inset_0_1px_2px_oklch(0_0_0/0.18)]',
      'data-disabled:cursor-not-allowed data-disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'block h-7 w-7 rounded-full bg-white shadow-[0_1px_1px_oklch(0_0_0/0.12),0_3px_8px_-2px_oklch(0_0_0/0.3)]',
        'transition-[translate,width] duration-500 ease-spring',
        'data-checked:translate-x-5',
        'group-active/switch:w-8 group-active/switch:data-checked:translate-x-4',
      )}
    />
  </SwitchPrimitive.Root>
)
