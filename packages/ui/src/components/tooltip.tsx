'use client'

import type { ReactElement, ReactNode } from 'react'

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'

import { cn } from '../lib/cn'
import { Kbd } from './kbd'

/**
 * Mount once around the app: tooltips next to each other share the wait, so after the first one shows, moving to its
 * neighbour shows the next at once.
 */
export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <TooltipPrimitive.Provider delay={350} closeDelay={0}>
    {children}
  </TooltipPrimitive.Provider>
)

type TooltipProps = {
  /** What the thing is or does. Short: a tooltip is a hint, not a place for content. */
  label: ReactNode
  /** The keys of its shortcut, shown after the label: `['Ctrl', 'B']`. */
  shortcut?: readonly string[]
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /** No tooltip: the element already says its name on screen (an item of the sidebar while the labels show). */
  disabled?: boolean
  /** The element the tooltip belongs to. It keeps its own accessible name: the tooltip is for sighted users. */
  children: ReactElement
}

/**
 * A hint that appears when an element is hovered or takes the keyboard focus (Base UI Tooltip): the name of an
 * icon-only control, with its shortcut when it has one. It is solid: a few words that must read over anything.
 *
 *   <Tooltip label="Collapse sidebar" shortcut={['Ctrl', 'B']} side="right">
 *     <button aria-label="Collapse sidebar">…</button>
 *   </Tooltip>
 */
export const Tooltip = ({
  label,
  shortcut,
  side = 'top',
  align = 'center',
  disabled = false,
  children,
}: TooltipProps) => (
  <TooltipPrimitive.Root disabled={disabled}>
    <TooltipPrimitive.Trigger render={children} />
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner side={side} align={align} sideOffset={10} className="z-[80]">
        <TooltipPrimitive.Popup
          className={cn(
            'flex items-center gap-2 rounded-lg bg-foreground px-2.5 py-1.5 text-[0.8125rem] leading-tight font-medium whitespace-nowrap text-background shadow-elevation',
            'origin-(--transform-origin) transition-[opacity,scale] duration-150 ease-out',
            'data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0',
            'data-instant:transition-none',
          )}
        >
          {label}
          {shortcut && (
            <span aria-hidden className="flex items-center gap-0.5">
              {shortcut.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </span>
          )}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  </TooltipPrimitive.Root>
)
