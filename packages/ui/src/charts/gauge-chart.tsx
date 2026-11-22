'use client'

import { PolarAngleAxis, RadialBar, RadialBarChart, Tooltip } from 'recharts'

import { type ChartBaseProps, ChartFrame, TooltipBox, tooltipRowsOf } from './chart'
import { colorOf } from './palette'

export type GaugeRing = { name: string; value: number; max?: number; color?: string }

export type GaugeChartProps = ChartBaseProps & {
  /** One value against `max`. Ignored when `rings` is given. */
  value?: number
  max?: number
  /** A second, thinner reading under the value: last month, the target. */
  mark?: number
  /** Several readings as concentric rings, each against its own maximum. */
  rings?: readonly GaugeRing[]
  /** How much of a circle the gauge spans. */
  arc?: 180 | 270 | 360
  /** The thickness of a ring, in px. */
  thickness?: number
  rounded?: boolean
  /** Big text in the middle, and the line under it. */
  center?: string
  caption?: string
  color?: string
  /** The grey track behind the value. Default: true. */
  track?: boolean
  tooltip?: boolean
  animate?: boolean
}

/**
 * How far a value has come against its maximum: a single arc with the number in the middle, or concentric rings for
 * a few readings side by side.
 *
 *   <GaugeChart value={3} max={4} center="75%" caption="profile done" arc={270} />
 */
export const GaugeChart = ({
  value = 0,
  max = 100,
  mark,
  rings,
  arc = 270,
  thickness = 12,
  rounded = true,
  center,
  caption,
  color = 'var(--primary)',
  track = true,
  tooltip = false,
  animate = true,
  height = 200,
  label,
  className,
}: GaugeChartProps) => {
  const start = arc === 360 ? 90 : arc === 180 ? 180 : 225
  const share = (part: number, whole: number) => (whole > 0 ? (Math.min(Math.max(part, 0), whole) / whole) * 100 : 0)

  const items = rings?.length
    ? rings.map((ring, index) => ({
        name: ring.name,
        share: share(ring.value, ring.max ?? max),
        fill: colorOf(index, 'categorical', ring.color),
      }))
    : [
        ...(mark === undefined ? [] : [{ name: 'Mark', share: share(mark, max), fill: 'var(--border-strong)' }]),
        { name: 'Value', share: share(value, max), fill: color },
      ]

  return (
    <div className={className}>
      <ChartFrame height={height} label={label}>
        <RadialBarChart
          data={items}
          startAngle={start}
          endAngle={start - arc}
          innerRadius={items.length > 2 ? '30%' : `${100 - thickness * 2.2}%`}
          outerRadius="100%"
          barSize={thickness}
          cy={arc === 180 ? '70%' : '50%'}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
          <RadialBar
            dataKey="share"
            background={track ? { fill: 'var(--muted)' } : false}
            cornerRadius={rounded ? thickness : 0}
            isAnimationActive={animate}
            animationDuration={800}
          />
          {tooltip && (
            <Tooltip content={(props) => <TooltipBox rows={tooltipRowsOf(props)} format="percent" indicator="dot" />} />
          )}
        </RadialBarChart>
      </ChartFrame>
      {(center || caption) && (
        <div
          aria-hidden
          className="pointer-events-none relative flex flex-col items-center justify-center"
          style={{
            marginTop: arc === 180 ? -height * 0.55 : -height * 0.6,
            height: arc === 180 ? height * 0.3 : height * 0.2,
          }}
        >
          <span className="font-display text-2xl leading-none font-bold tabular-nums">{center}</span>
          {caption && <span className="mt-1 text-xs text-muted-foreground">{caption}</span>}
        </div>
      )}
    </div>
  )
}
