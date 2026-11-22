'use client'

import { useId } from 'react'

import { Area, AreaChart, Bar, BarChart, Cell, Line, LineChart, ReferenceLine, YAxis } from 'recharts'

import type { Curve } from './cartesian-chart'
import { ChartFrame } from './chart'
import { toNumber } from './format'

const CURVES = { smooth: 'monotone', linear: 'linear', step: 'step', natural: 'natural' } as const

export type SparklineProps = {
  /** The values, oldest first. */
  data: readonly number[]
  type?: 'line' | 'area' | 'bar'
  color?: string
  /** In px. Default: 48. */
  height?: number
  /** A dot on the last value. Default: true. */
  last?: boolean
  /** A dashed line at this value: the average, the target. */
  reference?: number
  curve?: Curve
  label?: string
  className?: string
}

/**
 * A trend without axes, small enough to sit beside a number. No tooltip and no animation: it is read at a glance.
 *
 *   <Sparkline data={[3, 5, 4, 8, 6, 9]} type="area" />
 */
export const Sparkline = ({
  data,
  type = 'line',
  color = 'var(--primary)',
  height = 48,
  last = true,
  reference,
  curve = 'smooth',
  label,
  className,
}: SparklineProps) => {
  const id = useId().replace(/:/g, '')
  const rows = data.map((value, index) => ({ index, value }))
  const lastIndex = rows.length - 1
  const lastDot = last
    ? (props: { cx?: number; cy?: number; index?: number }) =>
        props.index === lastIndex ? (
          <circle
            key="last"
            cx={toNumber(props.cx)}
            cy={toNumber(props.cy)}
            r={3}
            fill="var(--card)"
            stroke={color}
            strokeWidth={2}
          />
        ) : (
          <g key={props.index} />
        )
    : false
  const referenceLine =
    reference === undefined ? null : (
      <ReferenceLine y={reference} stroke="var(--muted-foreground)" strokeDasharray="3 3" />
    )
  const margin = { top: 6, right: 6, bottom: 4, left: 4 }

  return (
    <ChartFrame height={height} label={label} className={className}>
      {type === 'bar' ? (
        <BarChart data={rows} margin={{ top: 4, right: 2, bottom: 2, left: 2 }}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          {referenceLine}
          <Bar dataKey="value" radius={[2, 2, 0, 0]} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.index} fill={color} fillOpacity={row.index === lastIndex ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      ) : type === 'area' ? (
        <AreaChart data={rows} margin={margin}>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.28} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          {referenceLine}
          <Area
            dataKey="value"
            type={CURVES[curve]}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id}-fill)`}
            dot={lastDot}
            isAnimationActive={false}
          />
        </AreaChart>
      ) : (
        <LineChart data={rows} margin={margin}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          {referenceLine}
          <Line
            dataKey="value"
            type={CURVES[curve]}
            stroke={color}
            strokeWidth={2}
            dot={lastDot}
            isAnimationActive={false}
          />
        </LineChart>
      )}
    </ChartFrame>
  )
}
