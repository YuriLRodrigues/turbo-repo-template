'use client'

import type { ReactNode } from 'react'

import {
  CartesianChart,
  FunnelChart,
  GaugeChart,
  Indicator,
  PieChart,
  RadarChart,
  ScatterChart,
  Sparkline,
  TreemapChart,
} from '@workspace/ui/charts'
import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'

import { PageHeader } from '@/components/shell/page-header'

/* Sample data: the gallery shows what each chart of the design system draws and how it is configured. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const traffic = MONTHS.map((month, index) => ({
  month,
  visits: 1200 + Math.round(Math.sin(index / 2) * 300) + index * 90,
  signUps: 180 + Math.round(Math.cos(index / 3) * 40) + index * 12,
}))
const revenue = MONTHS.slice(0, 6).map((month, index) => ({
  month,
  plan: 420_000 + index * 35_000,
  addons: 90_000 + index * 12_000,
  target: 560_000,
}))
const channels = [
  { name: 'Search', value: 4200 },
  { name: 'Direct', value: 2600 },
  { name: 'Social', value: 1800 },
  { name: 'Referral', value: 900 },
]
const skills = ['Speed', 'Quality', 'Docs', 'Tests', 'Design', 'Support'].map((skill, index) => ({
  skill,
  now: [7, 8, 5, 9, 6, 7][index],
  goal: 8,
}))
const funnel = [
  { name: 'Visits', value: 12_000 },
  { name: 'Sign-ups', value: 3_100 },
  { name: 'Activated', value: 1_450 },
  { name: 'Paying', value: 420 },
]
const tags = ['Work', 'Ideas', 'Reading', 'Travel', 'Recipes', 'Health', 'Music', 'Finance'].map((name, index) => ({
  name,
  value: [42, 31, 24, 18, 12, 9, 6, 4][index],
}))
const scatter = Array.from({ length: 24 }, (_, index) => ({
  x: 40 + ((index * 37) % 260),
  y: 2 + ((index * 13) % 20),
  z: 1 + (index % 5),
  name: `Note ${index + 1}`,
}))

const Example = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => (
  <Card>
    <CardHeader title={title} description={description} />
    <CardContent>{children}</CardContent>
  </Card>
)

/**
 * Every configurable chart of `@workspace/ui/charts`, with sample data. A screen of the product would put one of
 * these in a card and pass its own data (docs/patterns/web/charts.md).
 */
export const ChartsScreen = () => (
  <>
    <PageHeader title="Charts" description="The charts of the design system: Recharts with the colors of the theme." />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardContent>
          <Indicator
            title="Visits"
            value="14,982"
            change={12.4}
            caption="vs. last month"
            series={traffic.map((row) => row.visits)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Indicator
            title="Sign-ups"
            value="2,904"
            change={-3.1}
            caption="vs. last month"
            series={traffic.map((row) => row.signUps)}
            seriesType="bar"
          />
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Indicator title="Churn" value="1.8%" change={-0.6} good="down" caption="lower is better" />
          <Sparkline data={[2.6, 2.4, 2.5, 2.1, 1.9, 1.8]} type="line" reference={2.2} className="mt-3" />
        </CardContent>
      </Card>
    </div>

    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Example title="Cartesian: areas" description="Two series over the months, smooth, with a legend.">
        <CartesianChart
          data={traffic}
          x="month"
          series={[
            { key: 'visits', label: 'Visits' },
            { key: 'signUps', label: 'Sign-ups' },
          ]}
          legend
          label="Visits and sign-ups by month"
        />
      </Example>

      <Example title="Cartesian: stacked bars and a line" description="Money in cents, a target as a dashed line.">
        <CartesianChart
          data={revenue}
          x="month"
          type="bar"
          stacked
          format="money"
          series={[
            { key: 'plan', label: 'Plans' },
            { key: 'addons', label: 'Add-ons' },
            { key: 'target', label: 'Target', type: 'line', dashed: true, color: 'var(--muted-foreground)' },
          ]}
          legend
          label="Revenue by month"
        />
      </Example>

      <Example title="Cartesian: lying bars" description="Categories on the side, values written on the bars.">
        <CartesianChart
          data={channels}
          x="name"
          type="bar"
          horizontal
          labels
          axes="category"
          grid="none"
          track
          series={[{ key: 'value', label: 'Visits' }]}
          palette="accent"
          height={220}
          label="Visits by channel"
        />
      </Example>

      <Example title="Pie" description="A donut with the total in the middle.">
        <PieChart
          data={channels}
          donut
          center="9.5K"
          centerLabel="visits"
          legend
          separated
          rounded
          label="Visits by channel"
        />
      </Example>

      <Example title="Radar" description="A profile against a dashed target.">
        <RadarChart
          data={skills}
          axis="skill"
          max={10}
          series={[
            { key: 'now', label: 'Now' },
            { key: 'goal', label: 'Goal', dashed: true, color: 'var(--muted-foreground)' },
          ]}
          legend
          label="Team profile against the goal"
        />
      </Example>

      <Example title="Gauge" description="One value against its maximum, and a few as rings.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <GaugeChart
            value={72}
            max={100}
            mark={64}
            center="72%"
            caption="of the goal"
            height={180}
            label="72% of the goal"
          />
          <GaugeChart
            arc={360}
            thickness={10}
            height={180}
            rings={[
              { name: 'Docs', value: 80 },
              { name: 'Tests', value: 64 },
              { name: 'Types', value: 92 },
            ]}
            tooltip
            label="Coverage of docs, tests and types"
          />
        </div>
      </Example>

      <Example title="Funnel" description="Steps that narrow down.">
        <FunnelChart data={funnel} height={240} label="Conversion funnel" />
      </Example>

      <Example title="Treemap" description="Many parts of one whole.">
        <TreemapChart data={tags} height={240} label="Notes by tag" />
      </Example>

      <Example title="Scatter" description="Two measures against each other, the size as a third.">
        <ScatterChart
          series={[{ name: 'Notes', data: scatter }]}
          labelX="words"
          labelY="edits"
          references={[{ y: 15, label: 'often edited' }]}
          label="Words and edits of each note"
        />
      </Example>
    </div>
  </>
)
