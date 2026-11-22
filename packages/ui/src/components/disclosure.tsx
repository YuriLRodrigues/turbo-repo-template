'use client'

import type { ReactNode } from 'react'

import { Collapsible } from '@base-ui/react/collapsible'
import { ChevronDownIcon } from 'lucide-react'

import { cn } from '../lib/cn'

type DisclosureProps = {
  /** The text of the trigger: "More details". */
  label: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode
  className?: string
}

/**
 * Optional content behind one line: what most people skip stays out of the way and one tap brings it. The panel
 * grows and shrinks with its content (Base UI measures it into `--collapsible-panel-height`).
 */
export const Disclosure = ({ label, open, defaultOpen, onOpenChange, children, className }: DisclosureProps) => (
  <Collapsible.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange} className={className}>
    <Collapsible.Trigger
      className={cn(
        'group/trigger inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-primary-text select-none',
        '-ml-3 transition-[background-color,transform] duration-200 ease-out hover:bg-primary-soft active:scale-[0.97]',
      )}
    >
      {label}
      <ChevronDownIcon className="size-4 transition-transform duration-300 ease-out group-data-panel-open/trigger:rotate-180" />
    </Collapsible.Trigger>
    <Collapsible.Panel
      className={cn(
        'h-(--collapsible-panel-height) overflow-hidden transition-[height,opacity] duration-300 ease-out',
        'data-ending-style:h-0 data-ending-style:opacity-0 data-starting-style:h-0 data-starting-style:opacity-0',
      )}
    >
      {children}
    </Collapsible.Panel>
  </Collapsible.Root>
)
