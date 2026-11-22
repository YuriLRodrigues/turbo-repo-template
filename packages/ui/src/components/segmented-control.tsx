'use client'

import { type ReactNode, useRef } from 'react'

import { useRadioGroup } from '../hooks/use-radio-group'
import { useSlidingIndicator } from '../hooks/use-sliding-indicator'
import { cn } from '../lib/cn'
import { ArrowScrollArea } from './arrow-scroll-area'

type SegmentedControlProps<TValue extends string> = {
  /** What is being chosen, for screen readers: "Theme". */
  label: string
  value: TValue
  onValueChange: (value: TValue) => void
  options: readonly { value: TValue; label: ReactNode; icon?: ReactNode }[]
  size?: 'sm' | 'md'
  /** Segments share the width equally (default). `false` hugs the labels. */
  fullWidth?: boolean
  /** What scrolls, in the names of the arrows that appear when the segments do not fit. */
  itemsLabel?: string
  className?: string
}

/**
 * Two to four exclusive options in one track, with a raised thumb that slides to the chosen one. It is a radio
 * group: Tab reaches the chosen segment, the arrows move and choose.
 *
 * The segments never wrap and never cut their labels. When the track does not fit, it lives in an
 * `ArrowScrollArea`: two arrows over the faded edges, no scrollbar.
 */
export const SegmentedControl = <TValue extends string>({
  label,
  value,
  onValueChange,
  options,
  size = 'md',
  fullWidth = true,
  itemsLabel = 'options',
  className,
}: SegmentedControlProps<TValue>) => {
  const trackRef = useRef<HTMLDivElement>(null)
  useSlidingIndicator(trackRef, '[aria-checked="true"]', value)
  const radio = useRadioGroup({ values: options.map((option) => option.value), value, onValueChange })

  return (
    <ArrowScrollArea itemsLabel={itemsLabel} className={className}>
      <div
        ref={trackRef}
        aria-label={label}
        className={cn(
          // `min-w-max`: the track is never narrower than its segments; the box around it scrolls instead.
          'group/segmented relative isolate min-w-max rounded-(--radius-control) well p-1',
          fullWidth ? 'grid w-full auto-cols-fr grid-flow-col' : 'flex w-max',
        )}
        {...radio.groupProps}
      >
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-0 left-0 -z-10 rounded-[calc(var(--radius-control)-0.25rem)] raised opacity-0',
            'h-(--indicator-height) w-(--indicator-width) translate-x-(--indicator-x) translate-y-(--indicator-y)',
            'group-data-[indicator]/segmented:opacity-100',
            'group-data-[indicator=ready]/segmented:transition-[translate,width] group-data-[indicator=ready]/segmented:duration-500 group-data-[indicator=ready]/segmented:ease-spring',
          )}
        />
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-0.25rem)] font-medium whitespace-nowrap text-muted-foreground select-none',
              'transition-[color,transform] duration-200 ease-out active:scale-[0.97]',
              'hover:text-foreground aria-checked:text-foreground',
              size === 'sm' ? 'h-7 px-2.5 text-[0.8125rem]' : 'h-8 px-3 text-sm',
              '[&_svg]:size-4 [&_svg]:shrink-0',
            )}
            {...radio.itemProps(option.value)}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>
    </ArrowScrollArea>
  )
}
