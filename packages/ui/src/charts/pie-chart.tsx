'use client'

import { Cell, Label, Pie, PieChart as RechartsPieChart, Tooltip } from 'recharts'

import { type ChartBaseProps, ChartFrame, LegendList, type TooltipIndicator, TooltipBox, tooltipRowsOf } from './chart'
import { axisFormatterOf, toNumber, type ValueFormat } from './format'
import { type ChartPalette, colorOf, opacityOf } from './palette'

export type PieSlice = { name: string; value: number; color?: string; opacity?: number }

export type PieChartProps = ChartBaseProps & {
  data: readonly PieSlice[]
  /** A ring instead of a full pie. */
  donut?: boolean
  /** Half a circle (a gauge of parts). */
  half?: boolean
  /** What is written next to each slice. */
  labels?: 'none' | 'value' | 'percent' | 'name'
  legend?: boolean
  /** Big text in the middle of a donut (the total), and the line under it. */
  center?: string
  centerLabel?: string
  /** A gap between the slices. */
  separated?: boolean
  rounded?: boolean
  format?: ValueFormat
  palette?: ChartPalette
  tooltip?: TooltipIndicator | 'none'
  animate?: boolean
}

const RADIAN = Math.PI / 180

/**
 * Parts of one whole: a pie, a donut with the total in the middle, or half of one. Few slices read best (five or
 * fewer); more than that is a bar chart.
 *
 *   <PieChart data={[{ name: 'Pinned', value: 3 }, { name: 'Other', value: 9 }]} donut center="12" centerLabel="notes" />
 */
export const PieChart = ({
  data,
  donut = false,
  half = false,
  labels = 'none',
  legend = false,
  center,
  centerLabel,
  separated = false,
  rounded = false,
  format = 'number',
  palette = 'categorical',
  tooltip = 'dot',
  animate = true,
  height,
  label,
  className,
}: PieChartProps) => {
  const slices = data.map((slice, index) => ({
    ...slice,
    fill: colorOf(index, palette, slice.color),
    fillOpacity: slice.opacity ?? opacityOf(index, palette),
  }))
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const short = axisFormatterOf(format)

  const labelOf = (value: number, name: string): string => {
    if (labels === 'percent') return total > 0 ? `${Math.round((value / total) * 100)}%` : '0%'
    if (labels === 'name') return name

    return short(value)
  }

  return (
    <div className={className}>
      <ChartFrame height={height} label={label}>
        <RechartsPieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          {tooltip !== 'none' && (
            <Tooltip
              content={(props) => <TooltipBox rows={tooltipRowsOf(props)} format={format} indicator={tooltip} />}
            />
          )}
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy={half ? '80%' : '50%'}
            startAngle={half ? 180 : 90}
            endAngle={half ? 0 : -270}
            innerRadius={donut ? (half ? '110%' : '62%') : 0}
            outerRadius={half ? '150%' : labels !== 'none' ? '72%' : '88%'}
            paddingAngle={separated ? 3 : 0}
            cornerRadius={rounded ? 6 : 0}
            stroke={separated ? 'none' : 'var(--card)'}
            strokeWidth={2}
            isAnimationActive={animate}
            animationDuration={800}
            labelLine={false}
            label={
              labels === 'none'
                ? false
                : (props: {
                    cx?: number
                    cy?: number
                    midAngle?: number
                    outerRadius?: number
                    value?: unknown
                    name?: unknown
                  }) => {
                    const radius = toNumber(props.outerRadius) + 14
                    const cx = toNumber(props.cx)
                    const at = {
                      x: cx + radius * Math.cos(-toNumber(props.midAngle) * RADIAN),
                      y: toNumber(props.cy) + radius * Math.sin(-toNumber(props.midAngle) * RADIAN),
                    }

                    return (
                      <text
                        x={at.x}
                        y={at.y}
                        fill="var(--foreground)"
                        fontSize={11}
                        fontWeight={600}
                        textAnchor={at.x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                      >
                        {labelOf(toNumber(props.value), String(props.name ?? ''))}
                      </text>
                    )
                  }
            }
          >
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.fill} fillOpacity={slice.fillOpacity} />
            ))}
            {donut && center && (
              <Label
                content={(props) => {
                  // A polar view box (cx, cy) inside a pie; a cartesian one has neither.
                  const box = (props.viewBox ?? {}) as { cx?: number; cy?: number }
                  const cx = box.cx
                  const cy = box.cy
                  if (cx === undefined || cy === undefined) return null
                  const y = half ? cy - 22 : cy

                  return (
                    <text x={cx} y={y} textAnchor="middle" dominantBaseline="middle">
                      <tspan x={cx} y={y - 6} fill="var(--foreground)" fontSize={22} fontWeight={700}>
                        {center}
                      </tspan>
                      <tspan x={cx} y={y + 16} fill="var(--muted-foreground)" fontSize={12}>
                        {centerLabel ?? ''}
                      </tspan>
                    </text>
                  )
                }}
              />
            )}
          </Pie>
        </RechartsPieChart>
      </ChartFrame>
      {legend && (
        <LegendList
          items={slices.map((slice) => ({ label: slice.name, color: slice.fill, opacity: slice.fillOpacity }))}
        />
      )}
    </div>
  )
}
