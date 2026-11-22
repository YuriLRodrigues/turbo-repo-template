import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

import { formatPercent } from '@workspace/utils'

import { cn } from '../lib/cn'
import { Sparkline, type SparklineProps } from './sparkline'

export type IndicatorProps = {
  title: string
  /** The number, already formatted: `formatMoney(cents)`, `formatNumber(n)`. */
  value: string
  /** The change against the previous period, in percent: `12.5`, `-3`. */
  change?: number
  /** Which way is good news. Default: `up`. */
  good?: 'up' | 'down'
  /** A line under the value: "vs. last week". */
  caption?: string
  /** A small trend under the value. */
  series?: readonly number[]
  seriesType?: SparklineProps['type']
  compact?: boolean
  className?: string
}

/**
 * A number that matters, with how it moved and its trend: the tile of a dashboard. The change is green when it goes
 * the good way (`good`), red otherwise, and the arrow says the direction for whoever does not see the color.
 *
 *   <Indicator title="Notes" value="128" change={12.5} caption="vs. last week" series={[3, 5, 4, 8]} />
 */
export const Indicator = ({
  title,
  value,
  change,
  good = 'up',
  caption,
  series,
  seriesType = 'area',
  compact = false,
  className,
}: IndicatorProps) => {
  const up = change !== undefined && change > 0
  const goodNews = change === undefined || change === 0 ? undefined : good === 'up' ? up : !up
  const tone =
    goodNews === undefined
      ? 'bg-muted text-muted-foreground'
      : goodNews
        ? 'bg-success-soft text-success-text'
        : 'bg-destructive-soft text-destructive-text'

  return (
    <div className={cn('flex min-w-0 flex-col', compact ? 'gap-1.5' : 'gap-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-medium text-muted-foreground">{title}</span>
        {change !== undefined && (
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              tone,
            )}
          >
            {up ? <ArrowUpIcon aria-hidden className="size-3" /> : <ArrowDownIcon aria-hidden className="size-3" />}
            <span className="sr-only">{up ? 'Up' : 'Down'}</span>
            {formatPercent(Math.abs(change), { digits: Math.abs(change) < 10 ? 1 : 0 })}
          </span>
        )}
      </div>
      <span
        className={cn(
          'font-display leading-none font-bold tracking-[-0.02em] tabular-nums',
          compact ? 'text-xl' : 'text-[1.75rem]',
        )}
      >
        {value}
      </span>
      {series && series.length > 1 && (
        <Sparkline
          data={series}
          type={seriesType}
          height={compact ? 32 : 44}
          color={goodNews === false ? 'var(--destructive)' : 'var(--primary)'}
        />
      )}
      {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
    </div>
  )
}
