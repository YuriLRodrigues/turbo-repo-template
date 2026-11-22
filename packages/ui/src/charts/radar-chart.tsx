'use client'

import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart, Tooltip } from 'recharts'

import {
  AXIS_TICK,
  type ChartBaseProps,
  ChartFrame,
  LegendList,
  type TooltipIndicator,
  TooltipBox,
  tooltipRowsOf,
} from './chart'
import type { ValueFormat } from './format'
import { type ChartPalette, colorOf } from './palette'

export type RadarSeries = { key: string; label?: string; color?: string; dashed?: boolean }

export type RadarChartProps = ChartBaseProps & {
  data: readonly Record<string, unknown>[]
  /** The key of the name of each spoke. */
  axis: string
  series: readonly RadarSeries[]
  grid?: 'polygon' | 'circle'
  /** Fill the shape of each series. Default: true (a dashed series is never filled: it is a reference). */
  fill?: boolean
  dots?: boolean
  legend?: boolean
  /** The value at the edge. Default: the largest value. */
  max?: number
  format?: ValueFormat
  palette?: ChartPalette
  tooltip?: TooltipIndicator | 'none'
  animate?: boolean
}

/**
 * A profile over several measures of the same scale: one shape per series, a dashed one for a target to compare.
 *
 *   <RadarChart data={skills} axis="skill" series={[{ key: 'now' }, { key: 'goal', dashed: true }]} />
 */
export const RadarChart = ({
  data,
  axis,
  series,
  grid = 'polygon',
  fill = true,
  dots = false,
  legend = false,
  max,
  format = 'number',
  palette = 'categorical',
  tooltip = 'dot',
  animate = true,
  height,
  label,
  className,
}: RadarChartProps) => (
  <div className={className}>
    <ChartFrame height={height} label={label}>
      <RechartsRadarChart data={[...data]} outerRadius="72%">
        <PolarGrid stroke="var(--border)" gridType={grid} />
        <PolarAngleAxis dataKey={axis} tick={AXIS_TICK} />
        <PolarRadiusAxis angle={90} domain={[0, max ?? 'auto']} tick={false} axisLine={false} />
        {tooltip !== 'none' && (
          <Tooltip
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
        {series.map((item, index) => {
          const color = colorOf(index, palette, item.color)

          return (
            <Radar
              key={item.key}
              dataKey={item.key}
              name={item.label ?? item.key}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={item.dashed ? '4 4' : undefined}
              fill={color}
              fillOpacity={fill && !item.dashed ? 0.18 : 0}
              dot={dots ? { r: 3, fill: color } : false}
              isAnimationActive={animate}
              animationDuration={800}
            />
          )
        })}
      </RechartsRadarChart>
    </ChartFrame>
    {legend && (
      <LegendList
        items={series.map((item, index) => ({
          label: item.label ?? item.key,
          color: colorOf(index, palette, item.color),
        }))}
      />
    )}
  </div>
)
