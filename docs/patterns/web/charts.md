# Charts

Charts are drawn by **Recharts**, through the configurable components of `@workspace/ui/charts`. Never draw a chart
by hand in SVG: the components already solve the tooltip, the legend, the axes, the colors of both themes, the
reduced-motion case and the layout bug of [layout](./layout.md).

```tsx
import { CartesianChart, Indicator, PieChart } from '@workspace/ui/charts'
```

## The components

| Component        | For                                               | Key options                                                                                                                        |
| ---------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `CartesianChart` | areas, bars, lines or a mix over categories       | `type`, per-series `type`, `stacked`, `percent`, `horizontal`, `curve`, `labels`, `references`, `track`, `domain`, `allowDecimals` |
| `PieChart`       | parts of one whole (five or fewer)                | `donut`, `half`, `center` + `centerLabel`, `labels`, `separated`                                                                   |
| `RadarChart`     | a profile over measures of one scale              | `axis`, `series` (a `dashed` one is a target), `grid`, `max`                                                                       |
| `GaugeChart`     | one value against its maximum, or a few rings     | `value` + `max` (+ `mark`), `rings`, `arc` (180, 270, 360)                                                                         |
| `Sparkline`      | a trend beside a number, no axes                  | `type`, `reference`, `last`                                                                                                        |
| `Indicator`      | the tile of a dashboard: number, change, trend    | `value`, `change`, `good` (`up` / `down`), `series`, `caption`                                                                     |
| `FunnelChart`    | steps that narrow down                            | `labels`                                                                                                                           |
| `TreemapChart`   | many parts of one whole                           | blocks sized by `value`                                                                                                            |
| `ScatterChart`   | two measures against each other (a third as size) | `series` of `{ x, y, z? }`, `labelX`, `labelY`, `references`                                                                       |

All of them take `height`, `label` (the accessible name of the drawing) and `className`; the series-based ones take
`palette` (`categorical`, `accent`, `status`, `monochrome`), `format`, `legend` and `tooltip` (`dot`, `line`,
`dashed`, `none`). `apps/web/app/(app)/charts` shows every one of them with sample data.

## Values

`format` says how values are written in the tooltip, labels and axes: `money` (integer cents, as the API sends them),
`compactMoney`, `percent` (a share of 100), `number`, `compactNumber`, or a function. Axes use the short form
(`$12.5K`). The formatters come from `@workspace/utils`, so a chart writes a value the same way as the rest of the
screen.

## Colors

Only CSS variables of the tokens (`var(--chart-1)`, `var(--primary)`, `var(--muted-foreground)`), so a chart follows
the theme and the accent and is covered by the contrast checks. A series may set its own `color` with a token
(a target line in `var(--muted-foreground)`). Text drawn over a colored shape uses `HALO` (the ink outlined in the
card color), which reads on any fill.

## Rules

- A chart sits in a `Card` whose grid track has a size (`grid-cols-1`, `minmax(0, …)`); `ChartFrame` is `min-w-0`.
- Compute the data from the API in the screen (or better, ask the API for the aggregate), then pass plain rows. The
  chart never fetches.
- A chart is not the only way a number is told: the important value is also written (an `Indicator`, a caption).
- Five series or slices at most; beyond that, a table or a treemap.
