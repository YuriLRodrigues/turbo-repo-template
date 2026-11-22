'use client'

import { useId } from 'react'

import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  AXIS_TICK,
  type ChartBaseProps,
  ChartFrame,
  LegendList,
  type TooltipIndicator,
  TooltipBox,
  tooltipRowsOf,
} from './chart'
import { axisFormatterOf, toNumber, type ValueFormat } from './format'
import { type ChartPalette, colorOf, opacityOf } from './palette'

export type SeriesType = 'area' | 'bar' | 'line'
export type Curve = 'smooth' | 'linear' | 'step' | 'natural'

const CURVES = { smooth: 'monotone', linear: 'linear', step: 'step', natural: 'natural' } as const

export type CartesianSeries = {
  /** The key of the value in each row of `data`. A key starting with `_` is an invisible helper (a waterfall base). */
  key: string
  label?: string
  color?: string
  /** This series as another type than the chart's: a line over bars. */
  type?: SeriesType
  dashed?: boolean
  /** One color per bar of this series (highlight one, fade the rest). */
  cells?: { color?: string; opacity?: number }[]
}

export type ReferenceMark = { y: number; label?: string; color?: string }

export type CartesianChartProps = ChartBaseProps & {
  data: readonly Record<string, unknown>[]
  /** The key of the category of each row (a day, a month, a name). */
  x: string
  series: readonly CartesianSeries[]
  /** The type of every series that does not say its own. Default: `area`. */
  type?: SeriesType
  curve?: Curve
  /** Series on top of each other. */
  stacked?: boolean
  /** Stacked as shares of 100% of each category. */
  percent?: boolean
  /** Bars lying down: categories on the vertical axis. Only for bars. */
  horizontal?: boolean
  grid?: 'none' | 'horizontal' | 'vertical' | 'both'
  /** `category`: only the axis of the categories. `none`: no axis at all. */
  axes?: 'both' | 'category' | 'none'
  legend?: boolean
  /** The value written on each point or bar. */
  labels?: boolean | 'inside'
  dots?: boolean
  /** Areas fade towards the bottom. Default: true. */
  gradient?: boolean
  references?: readonly ReferenceMark[]
  format?: ValueFormat
  palette?: ChartPalette
  tooltip?: TooltipIndicator | 'none'
  /** The corner radius of the bars. */
  radius?: number
  barSize?: number
  /** A grey track behind each bar: a progress bar per category. */
  track?: boolean
  /** The value range of the axis, `[min, max]`. */
  domain?: [number, number]
  /** `false` for values that are counts: the axis never shows `0.5`. Default: true. */
  allowDecimals?: boolean
  /** The width of the category axis when `horizontal` (long names). */
  categoryAxisWidth?: number
  animate?: boolean
}

/**
 * Areas, bars, lines or a mix, on one or two axes: the chart most dashboards need. Each series is a key of the rows;
 * colors come from the palette (tokens), so the chart follows the theme and the accent.
 *
 *   <CartesianChart data={days} x="day" series={[{ key: 'notes', label: 'Notes' }]} type="bar" format="number" />
 */
export const CartesianChart = ({
  data,
  x,
  series,
  type = 'area',
  curve = 'smooth',
  stacked = false,
  percent = false,
  horizontal = false,
  grid = 'horizontal',
  axes = 'both',
  legend = false,
  labels = false,
  dots = false,
  gradient = true,
  references = [],
  format = 'number',
  palette = 'categorical',
  tooltip = 'dot',
  radius = 4,
  barSize = 40,
  track = false,
  domain,
  allowDecimals = true,
  categoryAxisWidth = 96,
  animate = true,
  height,
  label,
  className,
}: CartesianChartProps) => {
  const id = useId().replace(/:/g, '')
  const lying = horizontal && type === 'bar'
  const axisFormat = percent ? (value: number) => `${Math.round(value * 100)}%` : axisFormatterOf(format)
  const visible = series.filter((item) => !item.key.startsWith('_'))
  const stackId = stacked || percent ? 'stack' : undefined
  const valueDomain = !percent && domain ? { domain, allowDataOverflow: true } : {}

  const showValues = axes === 'both'
  const showCategories = axes !== 'none'
  const valueAxis = lying ? (
    <XAxis
      key="value"
      type="number"
      hide={!showValues}
      tickLine={false}
      axisLine={false}
      tick={AXIS_TICK}
      tickFormatter={axisFormat}
      allowDecimals={allowDecimals}
      {...valueDomain}
    />
  ) : (
    <YAxis
      key="value"
      hide={!showValues}
      tickLine={false}
      axisLine={false}
      tick={AXIS_TICK}
      width={56}
      tickFormatter={axisFormat}
      allowDecimals={allowDecimals}
      {...valueDomain}
    />
  )
  const categoryAxis = lying ? (
    <YAxis
      key="category"
      type="category"
      dataKey={x}
      hide={!showCategories}
      tickLine={false}
      axisLine={false}
      tick={AXIS_TICK}
      width={categoryAxisWidth}
    />
  ) : (
    <XAxis
      key="category"
      dataKey={x}
      hide={!showCategories}
      tickLine={false}
      axisLine={false}
      tick={AXIS_TICK}
      tickMargin={8}
      minTickGap={12}
    />
  )

  // Lying bars swap what "horizontal" and "vertical" grid lines mean.
  const verticalLines = grid === 'both' || (lying ? grid === 'horizontal' : grid === 'vertical')
  const horizontalLines = grid === 'both' || (lying ? grid === 'vertical' : grid === 'horizontal')

  return (
    <div className={className}>
      <ChartFrame height={height} label={label}>
        <ComposedChart
          data={[...data]}
          layout={lying ? 'vertical' : 'horizontal'}
          stackOffset={percent ? 'expand' : undefined}
          margin={{ top: labels && labels !== 'inside' ? 20 : 8, right: lying && labels ? 40 : 8, left: 0, bottom: 0 }}
          barCategoryGap="20%"
        >
          {gradient && (
            <defs>
              {series.map((item, index) => (
                <linearGradient key={item.key} id={`${id}-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={colorOf(index, palette, item.color)}
                    stopOpacity={0.3 * opacityOf(index, palette) + 0.05}
                  />
                  <stop offset="95%" stopColor={colorOf(index, palette, item.color)} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
          )}
          {grid !== 'none' && (
            <CartesianGrid
              vertical={verticalLines}
              horizontal={horizontalLines}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
          )}
          {categoryAxis}
          {valueAxis}
          {tooltip !== 'none' && (
            <Tooltip
              cursor={type === 'bar' ? { fill: 'var(--muted)' } : { stroke: 'var(--border-strong)' }}
              content={(props) => (
                <TooltipBox
                  title={String(props.label ?? '')}
                  rows={tooltipRowsOf(props)}
                  format={format}
                  indicator={tooltip}
                />
              )}
            />
          )}
          {references.map((mark) => (
            <ReferenceLine
              key={`${mark.y}-${mark.label ?? ''}`}
              {...(lying ? { x: mark.y } : { y: mark.y })}
              stroke={mark.color ?? 'var(--destructive)'}
              strokeDasharray="5 4"
              label={
                mark.label
                  ? {
                      value: mark.label,
                      position: 'insideTopRight',
                      fill: mark.color ?? 'var(--destructive)',
                      fontSize: 11,
                      fontWeight: 600,
                    }
                  : undefined
              }
            />
          ))}
          {series.map((item, index) => {
            const seriesType = item.type ?? type
            const color = colorOf(index, palette, item.color)
            const opacity = opacityOf(index, palette)
            const helper = item.key.startsWith('_')
            const common = {
              dataKey: item.key,
              name: item.label ?? item.key,
              isAnimationActive: animate,
              animationDuration: 700,
            }
            const valueLabels =
              labels && !helper ? (
                <LabelList
                  dataKey={item.key}
                  position={labels === 'inside' ? (lying ? 'insideRight' : 'insideTop') : lying ? 'right' : 'top'}
                  offset={8}
                  formatter={(value: unknown) => (toNumber(value) ? axisFormat(toNumber(value)) : '')}
                  fill={labels === 'inside' ? 'var(--primary-foreground)' : 'var(--muted-foreground)'}
                  fontSize={11}
                  fontWeight={600}
                />
              ) : null

            if (seriesType === 'bar') {
              const last = visible.length - 1
              const position = visible.findIndex((candidate) => candidate.key === item.key)
              const corners: [number, number, number, number] = lying ? [0, radius, radius, 0] : [radius, radius, 0, 0]
              const stackedCorners = stackId && position !== last ? 0 : corners

              return (
                <Bar
                  key={item.key}
                  {...common}
                  fill={helper ? 'transparent' : color}
                  fillOpacity={opacity}
                  stackId={stackId}
                  radius={helper ? 0 : track ? radius : stackedCorners}
                  background={track && !helper ? { fill: 'var(--muted)', radius } : undefined}
                  maxBarSize={barSize}
                  legendType={helper ? 'none' : undefined}
                >
                  {valueLabels}
                  {item.cells?.map((cell, cellIndex) => (
                    <Cell key={cellIndex} fill={cell.color ?? color} fillOpacity={cell.opacity ?? opacity} />
                  ))}
                </Bar>
              )
            }

            if (seriesType === 'line') {
              return (
                <Line
                  key={item.key}
                  {...common}
                  type={CURVES[curve]}
                  stroke={color}
                  strokeOpacity={opacity}
                  strokeWidth={2}
                  strokeDasharray={item.dashed ? '6 5' : undefined}
                  dot={dots ? { r: 3, fill: 'var(--card)', stroke: color, strokeWidth: 2 } : false}
                  activeDot={{ r: 4 }}
                  connectNulls
                >
                  {valueLabels}
                </Line>
              )
            }

            return (
              <Area
                key={item.key}
                {...common}
                type={CURVES[curve]}
                stroke={color}
                strokeOpacity={Math.max(opacity, 0.5)}
                strokeWidth={2}
                strokeDasharray={item.dashed ? '6 5' : undefined}
                fill={gradient ? `url(#${id}-${index})` : color}
                fillOpacity={gradient ? 1 : 0.16 * opacity}
                stackId={stackId}
                dot={dots ? { r: 2.5, fill: color } : false}
                connectNulls
              >
                {valueLabels}
              </Area>
            )
          })}
        </ComposedChart>
      </ChartFrame>
      {legend && (
        <LegendList
          items={visible.map((item) => {
            const index = series.indexOf(item)

            return {
              label: item.label ?? item.key,
              color: colorOf(index, palette, item.color),
              opacity: opacityOf(index, palette),
            }
          })}
        />
      )}
    </div>
  )
}
