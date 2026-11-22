'use client'

import type { ComponentProps, ReactNode } from 'react'

import { useRadioGroup } from '../hooks/use-radio-group'
import { cn } from '../lib/cn'
import { ArrowScrollArea } from './arrow-scroll-area'

const chipClass = cn(
  'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full well pr-3 pl-2.5 text-sm font-medium whitespace-nowrap text-foreground select-none',
  'transition-[transform,background-color,color,box-shadow] duration-200 ease-out',
  'hover:bg-muted-hover active:scale-95 active:duration-75',
  'data-selected:bg-primary data-selected:text-primary-foreground',
  '[&_svg]:size-4 [&_svg]:shrink-0',
)

type ChipProps = Omit<ComponentProps<'button'>, 'value'> & {
  selected?: boolean
  /** Shown before the label: an icon, a colored dot. */
  icon?: ReactNode
}

/** A pill that can be switched on and off (`aria-pressed`): a filter. For one choice among several, `<ChipGroup>`. */
export const Chip = ({ selected = false, icon, className, children, ...props }: ChipProps) => (
  <button
    type="button"
    aria-pressed={selected}
    data-selected={selected ? '' : undefined}
    className={cn(chipClass, !icon && 'pl-3', className)}
    {...props}
  >
    {icon}
    {children}
  </button>
)

type ChipGroupProps<TValue extends string> = {
  /** What is being chosen, for screen readers: "Filter". */
  label: string
  /** What scrolls, in the names of the arrows that appear when the chips do not fit: "filters". */
  itemsLabel?: string
  value: TValue | null
  onValueChange: (value: TValue) => void
  options: readonly { value: TValue; label: ReactNode; icon?: ReactNode }[]
  className?: string
}

/**
 * One choice among chips (a filter, a tag). It is a radio group: Tab reaches the chosen chip (or
 * the first one), the arrows of the keyboard move and choose.
 *
 * Always one line. When the chips do not fit, the row lives in an `ArrowScrollArea`: two arrows over the faded
 * edges, no scrollbar, and the chosen chip is brought whole into view.
 */
export const ChipGroup = <TValue extends string>({
  label,
  itemsLabel = 'options',
  value,
  onValueChange,
  options,
  className,
}: ChipGroupProps<TValue>) => {
  const radio = useRadioGroup({ values: options.map((option) => option.value), value, onValueChange })

  return (
    <ArrowScrollArea itemsLabel={itemsLabel} className={className}>
      <div aria-label={label} className="flex w-max gap-2" {...radio.groupProps}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            data-selected={option.value === value ? '' : undefined}
            className={cn(chipClass, !option.icon && 'pl-3')}
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
