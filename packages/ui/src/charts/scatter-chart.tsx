'use client'

import {
  CartesianGrid,
  ReferenceLine,
  Scatter,
  ScatterChart as RechartsScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'

import type { ReferenceMark } from './cartesian-chart'
import { AXIS_TICK, type ChartBaseProps, ChartFrame, LegendList } from './chart'
import { axisFormatterOf, toNumber, type ValueFormat } from './format'
import { type ChartPalette, colorOf } from './palette'

export type ScatterPoint = { x: number; y: number; z?: number; name?: string }
export type ScatterSeries = { name: string; data: readonly ScatterPoint[]; color?: string }

export type ScatterChartProps = ChartBaseProps & {
  series: readonly ScatterSeries[]
  formatX?: ValueFormat
  formatY?: ValueFormat
  labelX?: string
  labelY?: string
  /** How big the bubbles get when the points have `z`. Default: 1. */
  size?: number
  references?: readonly ReferenceMark[]
  legend?: boolean
  palette?: ChartPalette
  tooltip?: boolean
  animate?: boolean
}

/**
 * Two measures of the same things against each other (and a third as the size of the bubble): where a relation or
 * the outliers are the point.
 *
 *   <ScatterChart series={[{ name: 'Notes', data: notes.map((n) => ({ x: n.words, y: n.edits })) }]} />
 */
export const ScatterChart = ({
  series,
  formatX = 'number',
  formatY = 'number',
  labelX = 'x',
  labelY = 'y',
  size = 1,
  references = [],
  legend = false,
  palette = 'categorical',
  tooltip = true,
  animate = true,
  height,
  label,
  className,
}: ScatterChartProps) => {
  const fx = axisFormatterOf(formatX)
  const fy = axisFormatterOf(formatY)

  return (
    <div className={className}>
      <ChartFrame height={height} label={label}>
        <RechartsScatterChart margin={{ top: 12, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis
            type="number"
            dataKey="x"
            name={labelX}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={fx}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={labelY}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            width={56}
            tickFormatter={fy}
          />
          <ZAxis type="number" dataKey="z" range={[40, size * 480]} />
          {references.map((mark) => (
            <ReferenceLine
              key={`${mark.y}-${mark.label ?? ''}`}
              y={mark.y}
              stroke={mark.color ?? 'var(--warning)'}
              strokeDasharray="5 4"
              label={
                mark.label
                  ? {
                      value: mark.label,
                      position: 'insideTopRight',
                      fill: mark.color ?? 'var(--warning-text)',
                      fontSize: 11,
                    }
                  : undefined
              }
            />
          ))}
          {tooltip && (
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-strong)' }}
              content={(props) => {
                const point = props.active ? (props.payload?.[0]?.payload as ScatterPoint | undefined) : undefined
                if (!point) return null

                return (
                  <div className="rounded-lg border border-border bg-popover px-2.5 py-2 text-xs shadow-elevation-lg">
                    {point.name && <div className="mb-1 font-semibold">{point.name}</div>}
                    <div className="text-muted-foreground">
                      {labelX}: {fx(toNumber(point.x))} · {labelY}: {fy(toNumber(point.y))}
                    </div>
                  </div>
                )
              }}
            />
          )}
          {series.map((item, index) => (
            <Scatter
              key={item.name}
              name={item.name}
              data={[...item.data]}
              fill={colorOf(index, palette, item.color)}
              fillOpacity={0.7}
              stroke={colorOf(index, palette, item.color)}
              isAnimationActive={animate}
              animationDuration={700}
            />
          ))}
        </RechartsScatterChart>
      </ChartFrame>
      {legend && (
        <LegendList
          items={series.map((item, index) => ({ label: item.name, color: colorOf(index, palette, item.color) }))}
        />
      )}
    </div>
  )
}
