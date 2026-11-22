'use client'

import type { CSSProperties, ReactNode } from 'react'

import { ResponsiveContainer } from 'recharts'

import { cn } from '../lib/cn'
import { formatterOf, toNumber, type ValueFormat } from './format'

/*
 * The frame, the tooltip and the legend every chart of the system shares, in the spirit of shadcn's `chart.tsx`:
 * Recharts draws, the tokens color, and these pieces make every chart read the same.
 */

/** The shared props of every chart. */
export type ChartBaseProps = {
  /** The height of the drawing, in px. The width is the width of the container. */
  height?: number
  /** What the chart shows, for screen readers: "Notes written per day". */
  label?: string
  className?: string
}

/** Text drawn over a colored shape that reads on any of them: the ink, outlined in the card color. */
export const HALO = { fill: 'var(--foreground)', stroke: 'var(--card)', strokeWidth: 3, paintOrder: 'stroke' } as const

/** The axis ticks and labels: small, quiet, in the font of the interface. */
export const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 12 } as const

type ChartFrameProps = ChartBaseProps & {
  children: ReactNode
  style?: CSSProperties
}

/**
 * The box of a chart: a fixed height and the full width of its container, and never wider. `min-w-0` is the point:
 * a chart inside a grid track or a flex row that sizes itself by its content would widen the track instead of
 * fitting it, and the card around would cut the drawing (docs/patterns/web/layout.md). `ResponsiveContainer` measures
 * the box, so the drawing follows the layout, never the other way around.
 */
export const ChartFrame = ({ height = 240, label, className, style, children }: ChartFrameProps) => (
  <div
    role={label ? 'img' : undefined}
    aria-label={label}
    className={cn('relative w-full min-w-0 font-sans text-xs', className)}
    style={{ height, ...style }}
  >
    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height }}>
      {children}
    </ResponsiveContainer>
  </div>
)

export type TooltipIndicator = 'dot' | 'line' | 'dashed'

/** One row of a tooltip, as the charts hand it over. */
export type TooltipRow = { name: string; value: number; color: string }

type TooltipBoxProps = {
  title?: ReactNode
  rows: TooltipRow[]
  format?: ValueFormat
  indicator?: TooltipIndicator
}

const markerClass: Record<TooltipIndicator, string> = {
  dot: 'size-2 rounded-[2px]',
  line: 'h-4 w-1 rounded-[2px]',
  dashed: 'h-4 w-0 border-l-2 border-dashed bg-transparent',
}

/** The box of every tooltip: a title and one row per series, the value aligned at the end. */
export const TooltipBox = ({ title, rows, format, indicator = 'dot' }: TooltipBoxProps) => {
  if (rows.length === 0) return null
  const formatValue = formatterOf(format)

  return (
    <div className="min-w-36 rounded-lg border border-border bg-popover px-2.5 py-2 text-xs text-foreground shadow-elevation-lg">
      {title !== undefined && title !== '' && <div className="mb-1.5 font-semibold">{title}</div>}
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn('shrink-0', markerClass[indicator])}
              style={indicator === 'dashed' ? { borderColor: row.color } : { backgroundColor: row.color }}
            />
            <span className="text-muted-foreground">{row.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums">{formatValue(row.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** What Recharts passes to a tooltip `content` function, reduced to what the box needs. */
type RechartsTooltipProps = {
  active?: boolean
  label?: unknown
  payload?: readonly {
    name?: unknown
    value?: unknown
    color?: string
    fill?: string
    dataKey?: unknown
    payload?: Record<string, unknown>
  }[]
}

/** Turns what Recharts gives a tooltip into rows. Series whose key starts with `_` are helpers and never shown. */
export const tooltipRowsOf = (props: RechartsTooltipProps): TooltipRow[] =>
  !props.active || !props.payload
    ? []
    : props.payload
        .filter((item) => item.value !== undefined && item.value !== null && !String(item.dataKey).startsWith('_'))
        .map((item) => ({
          name: String(item.name ?? item.dataKey ?? ''),
          value: toNumber(item.value),
          color: String(item.payload?.fill ?? item.color ?? item.fill ?? 'var(--foreground)'),
        }))

type LegendItem = { label: string; color: string; opacity?: number }

/** The legend of every chart: a small square and the name of each series, centered under the drawing. */
export const LegendList = ({ items }: { items: LegendItem[] }) => (
  <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 text-xs font-medium text-muted-foreground">
    {items.map((item) => (
      <li key={item.label} className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-2.5 rounded-[3px]"
          style={{ backgroundColor: item.color, opacity: item.opacity ?? 1 }}
        />
        {item.label}
      </li>
    ))}
  </ul>
)
