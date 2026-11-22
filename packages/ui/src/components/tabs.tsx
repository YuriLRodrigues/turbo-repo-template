'use client'

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'

import { cn } from '../lib/cn'
import { ArrowScrollArea } from './arrow-scroll-area'

/**
 * Views of the same thing, one at a time (Base UI Tabs: roving focus with the arrow keys, `aria-selected`, each
 * panel labelled by its tab).
 *
 *   <Tabs value={view} onValueChange={setView}>
 *     <TabsList label="View">
 *       <TabsTab value="active">Active</TabsTab>
 *       <TabsTab value="archived">Archived</TabsTab>
 *     </TabsList>
 *     <TabsPanel value="active">…</TabsPanel>
 *     <TabsPanel value="archived">…</TabsPanel>
 *   </Tabs>
 */
export const Tabs = ({ className, ...props }: TabsPrimitive.Root.Props) => (
  <TabsPrimitive.Root className={cn('flex min-w-0 flex-col gap-3', className)} {...props} />
)

type TabsListProps = Omit<TabsPrimitive.List.Props, 'className'> & {
  /** What the tabs switch, for screen readers: "Chart measure". */
  label: string
  /** What scrolls, in the names of the arrows that appear when the tabs do not fit. */
  itemsLabel?: string
  size?: 'sm' | 'md'
  /** The tabs share the width equally. Default: they hug their labels. */
  fullWidth?: boolean
  className?: string
}

/**
 * The row of tabs: the same track and the same raised thumb as a segmented control. The tabs never wrap and never
 * cut their labels: when the row does not fit it lives in an `ArrowScrollArea` (two arrows over the faded edges, no
 * scrollbar).
 */
export const TabsList = ({
  label,
  itemsLabel = 'tabs',
  size = 'md',
  fullWidth = false,
  className,
  children,
  ...props
}: TabsListProps) => (
  <ArrowScrollArea itemsLabel={itemsLabel} className={className}>
    <TabsPrimitive.List
      aria-label={label}
      data-size={size}
      className={cn(
        'group/tabs relative isolate min-w-max rounded-(--radius-control) well p-1',
        fullWidth ? 'grid w-full auto-cols-fr grid-flow-col' : 'flex w-max',
      )}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        renderBeforeHydration
        className={cn(
          'absolute top-0 left-0 -z-10 rounded-[calc(var(--radius-control)-0.25rem)] raised',
          'h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) translate-y-(--active-tab-top)',
          'transition-[translate,width] duration-500 ease-spring',
        )}
      />
    </TabsPrimitive.List>
  </ArrowScrollArea>
)

export const TabsTab = ({ className, ...props }: TabsPrimitive.Tab.Props) => (
  <TabsPrimitive.Tab
    className={cn(
      'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-0.25rem)] font-medium whitespace-nowrap text-muted-foreground select-none',
      'transition-[color,transform] duration-200 ease-out active:scale-[0.97]',
      'hover:text-foreground data-active:text-foreground',
      'h-8 px-3 text-sm group-data-[size=sm]/tabs:h-7 group-data-[size=sm]/tabs:px-2.5 group-data-[size=sm]/tabs:text-[0.8125rem]',
      'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
      className,
    )}
    {...props}
  />
)

/** The view of one tab. It can take the focus (the keyboard goes from the tab into it) and shows the ring then. */
export const TabsPanel = ({ className, ...props }: TabsPrimitive.Panel.Props) => (
  <TabsPrimitive.Panel className={cn('min-w-0 rounded-xl', className)} {...props} />
)
