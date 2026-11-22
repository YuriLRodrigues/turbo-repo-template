'use client'

import { Cell, Funnel, FunnelChart as RechartsFunnelChart, LabelList, Tooltip } from 'recharts'

import { type ChartBaseProps, ChartFrame, HALO, type TooltipIndicator, TooltipBox, tooltipRowsOf } from './chart'
import { axisFormatterOf, toNumber, type ValueFormat } from './format'
import { type ChartPalette, colorOf, opacityOf } from './palette'

export type FunnelStep = { name: string; value: number; color?: string; opacity?: number }

export type FunnelChartProps = ChartBaseProps & {
  /** The steps, from the widest to the narrowest: visits, sign-ups, active people. */
  data: readonly FunnelStep[]
  /** The name beside each step and the value inside it. Default: true. */
  labels?: boolean
  format?: ValueFormat
  palette?: ChartPalette
  tooltip?: TooltipIndicator | 'none'
  animate?: boolean
}

/**
 * Steps that narrow down, each a part of the one before: a conversion, what is left of a budget.
 *
 *   <FunnelChart data={[{ name: 'Visits', value: 1200 }, { name: 'Sign-ups', value: 300 }]} />
 */
export const FunnelChart = ({
  data,
  labels = true,
  format = 'number',
  palette = 'monochrome',
  tooltip = 'dot',
  animate = true,
  height,
  label,
  className,
}: FunnelChartProps) => {
  const steps = data.map((step, index) => ({
    ...step,
    fill: colorOf(index, palette, step.color),
    fillOpacity: step.opacity ?? opacityOf(index, palette),
  }))
  const short = axisFormatterOf(format)

  return (
    <ChartFrame height={height} label={label} className={className}>
      <RechartsFunnelChart margin={{ top: 8, right: labels ? 120 : 8, bottom: 8, left: 8 }}>
        {tooltip !== 'none' && (
          <Tooltip
            content={(props) => <TooltipBox rows={tooltipRowsOf(props)} format={format} indicator={tooltip} />}
          />
        )}
        <Funnel
          dataKey="value"
          nameKey="name"
          data={steps}
          isAnimationActive={animate}
          animationDuration={800}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {steps.map((step) => (
            <Cell key={step.name} fill={step.fill} fillOpacity={step.fillOpacity} />
          ))}
          {labels && (
            <LabelList
              position="right"
              dataKey="name"
              fill="var(--foreground)"
              stroke="none"
              fontSize={12}
              fontWeight={600}
            />
          )}
          {labels && (
            <LabelList
              position="center"
              dataKey="value"
              formatter={(value: unknown) => short(toNumber(value))}
              {...HALO}
              fontSize={12}
              fontWeight={700}
            />
          )}
        </Funnel>
      </RechartsFunnelChart>
    </ChartFrame>
  )
}
