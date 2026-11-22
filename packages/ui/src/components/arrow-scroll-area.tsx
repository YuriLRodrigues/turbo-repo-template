'use client'

import type { ReactNode } from 'react'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { type ArrowScrollDirection, useArrowScroll } from '../hooks/use-arrow-scroll'
import { cn } from '../lib/cn'
import { ScrollArea } from './scroll-area'

type ArrowButtonProps = {
  direction: ArrowScrollDirection
  /** What scrolls, in the name of the arrow: "filters" gives "Scroll filters left". */
  itemsLabel: string
  /** Already at that end: the arrow is locked and fades out without leaving the DOM, so the pair stays stable. */
  disabled: boolean
  onScroll: (direction: ArrowScrollDirection) => void
}

/**
 * An arrow that moves the row. Out of the Tab order: the keyboard walks the items themselves and the focused one
 * scrolls into view, so two more tab stops would only slow it down. The name stays for the pointer and for screen
 * readers.
 */
const ArrowButton = ({ direction, itemsLabel, disabled, onScroll }: ArrowButtonProps) => {
  const Icon = direction === -1 ? ChevronLeftIcon : ChevronRightIcon

  return (
    <button
      type="button"
      tabIndex={-1}
      data-direction={direction === -1 ? 'back' : 'forward'}
      aria-label={`Scroll ${itemsLabel} ${direction === -1 ? 'left' : 'right'}`}
      aria-hidden={disabled || undefined}
      disabled={disabled}
      // It never takes the focus: the press scrolls and the focus stays where it was.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onScroll(direction)}
      className="arrow-scroll-button"
    >
      <Icon aria-hidden className="size-4" strokeWidth={2.5} />
    </button>
  )
}

type ArrowScrollAreaProps = {
  children: ReactNode
  /** What scrolls, for the names of the arrows. Default: "options". */
  itemsLabel?: string
  /**
   * The outer box. The room kept around the row for focus rings and shadows is `--bleed-x`, `--bleed-top` and
   * `--bleed-bottom` (default 0.375rem): raise one when the items cast a longer shadow.
   */
  className?: string
  viewportClassName?: string
}

/**
 * Where a compact group of controls lives when it may not fit: tabs, the segments of a segmented control, a group of
 * chips, a row of swatches. One line, never a visible scrollbar.
 *
 * - While everything fits there is nothing but the row: no arrow, no fade.
 * - When it overflows, two arrows are laid over the faded edges and each press moves 80% of what is visible. The
 *   fade only shows on the side that can still scroll, and the arrow of an end that was reached is locked and
 *   faded out.
 * - The arrows are laid over the row, not beside it: they only arrive after measuring, and reserving room for them
 *   would make the row jump.
 * - The item that is focused or chosen (`aria-selected`, `aria-checked`, `aria-pressed`) is scrolled until it is
 *   whole between the arrows. The box itself is not a tab stop: the keyboard walks the items.
 * - Drag (mouse), wheel, trackpad and touch still scroll it.
 *
 *   <ArrowScrollArea itemsLabel="filters">
 *     <div role="radiogroup" className="flex w-max gap-2">…</div>
 *   </ArrowScrollArea>
 */
export const ArrowScrollArea = ({
  children,
  itemsLabel = 'options',
  className,
  viewportClassName,
}: ArrowScrollAreaProps) => {
  const { viewportRef, overflow, atStart, atEnd, scrollByPage } = useArrowScroll()

  return (
    <div data-overflow={overflow ? '' : undefined} className={cn('arrow-scroll-area', className)}>
      <ScrollArea
        axis="x"
        fade={overflow}
        scrollbar="hidden"
        focusable="never"
        viewportRef={viewportRef}
        viewportClassName={viewportClassName}
      >
        {children}
      </ScrollArea>
      {overflow && (
        <>
          <ArrowButton direction={-1} itemsLabel={itemsLabel} disabled={atStart} onScroll={scrollByPage} />
          <ArrowButton direction={1} itemsLabel={itemsLabel} disabled={atEnd} onScroll={scrollByPage} />
        </>
      )}
    </div>
  )
}
