'use client'

import { Tooltip, Treemap } from 'recharts'

import { type ChartBaseProps, ChartFrame, HALO, TooltipBox, tooltipRowsOf } from './chart'
import { axisFormatterOf, toNumber, type ValueFormat } from './format'
import { type ChartPalette, colorOf, opacityOf } from './palette'

export type TreemapBlock = { name: string; value: number; color?: string; opacity?: number }

export type TreemapChartProps = ChartBaseProps & {
  data: readonly TreemapBlock[]
  format?: ValueFormat
  palette?: ChartPalette
  tooltip?: boolean
}

type BlockProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  name?: unknown
  value?: unknown
  index?: number
  /** 0 is the whole (Recharts draws it too), 1 a block of the data. */
  depth?: number
  blocks: readonly TreemapBlock[]
  palette: ChartPalette
  format: ValueFormat
}

/** One block, drawn by Recharts with the geometry of the layout; the rest comes from the chart. */
const BlockShape = ({
  x = 0,
  y = 0,
  width = 0,
  height: blockHeight = 0,
  name,
  value,
  index = 0,
  depth = 1,
  blocks,
  palette,
  format,
}: BlockProps) => {
  const short = axisFormatterOf(format)
  if (depth !== 1 || width <= 0 || blockHeight <= 0) return null
  const block = blocks[index]
  const opacity = block?.opacity ?? opacityOf(index, palette)

  return (
    <g>
      <rect
        x={x + 2}
        y={y + 2}
        width={Math.max(0, width - 4)}
        height={Math.max(0, blockHeight - 4)}
        rx={8}
        fill={colorOf(index, palette, block?.color)}
        fillOpacity={opacity}
      />
      {width > 64 && blockHeight > 36 && (
        <text x={x + 12} y={y + 22} {...HALO} fontSize={12} fontWeight={600}>
          {String(name ?? '')}
        </text>
      )}
      {width > 64 && blockHeight > 54 && (
        <text x={x + 12} y={y + 40} {...HALO} fontSize={12}>
          {short(toNumber(value))}
        </text>
      )}
    </g>
  )
}

/**
 * Many parts of one whole, as blocks the size of their value, with the name and the value inside the ones that have
 * room. Where a pie would have too many slices.
 *
 *   <TreemapChart data={tags.map((tag) => ({ name: tag.name, value: tag.count }))} />
 */
export const TreemapChart = ({
  data,
  format = 'number',
  palette = 'monochrome',
  tooltip = true,
  height,
  label,
  className,
}: TreemapChartProps) => {
  const blocks = data.map((block) => ({ ...block }))

  return (
    <ChartFrame height={height} label={label} className={className}>
      <Treemap
        data={blocks}
        dataKey="value"
        nameKey="name"
        content={<BlockShape blocks={blocks} palette={palette} format={format} />}
        isAnimationActive={false}
        stroke="none"
      >
        {tooltip && <Tooltip content={(props) => <TooltipBox rows={tooltipRowsOf(props)} format={format} />} />}
      </Treemap>
    </ChartFrame>
  )
}
