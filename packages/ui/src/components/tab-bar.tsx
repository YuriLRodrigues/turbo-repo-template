'use client'

import { type ReactNode, useRef } from 'react'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'

import { useSlidingIndicator } from '../hooks/use-sliding-indicator'
import { cn } from '../lib/cn'

type TabBarProps = {
  /** The accessible name of the navigation: "Main navigation". */
  label: string
  /** Whatever changes when the active tab changes (the pathname): the highlight slides when it does. */
  activeKey: string
  /**
   * The one action of the app, docked at the end of the bar (a round "+"). It lives in the row of the bar, which the
   * content already ends above: nothing floats over a list.
   */
  action?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * The navigation of the phone: a bar floating above the bottom edge (and above the home indicator, through the
 * safe-area inset), with a highlight that slides under the active tab, and the action of the app beside it. Behind
 * the row, the content fades into the page (`.scroll-edge`).
 */
export const TabBar = ({ label, activeKey, action, children, className }: TabBarProps) => {
  const listRef = useRef<HTMLUListElement>(null)
  useSlidingIndicator(listRef, '[data-active]', activeKey)

  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]',
        className,
      )}
    >
      <span aria-hidden className="scroll-edge" />
      <div className="flex w-full max-w-md items-center gap-2">
        <nav
          aria-label={label}
          className="pointer-events-auto min-w-0 flex-1 rounded-2xl border border-border bg-popover/95 shadow-elevation-lg backdrop-blur-md"
        >
          {/* Equal columns while every label fits; on a narrow phone the longest label takes the little it needs
              from the others instead of being cut. */}
          <ul
            ref={listRef}
            className="group/tabs relative isolate grid auto-cols-[minmax(min-content,1fr)] grid-flow-col p-1"
          >
            <li
              aria-hidden
              className={cn(
                'pointer-events-none absolute top-0 left-0 -z-10 rounded-xl bg-muted opacity-0',
                'h-(--indicator-height) w-(--indicator-width) translate-x-(--indicator-x) translate-y-(--indicator-y)',
                'group-data-[indicator]/tabs:opacity-100',
                'group-data-[indicator=ready]/tabs:transition-[translate,width] group-data-[indicator=ready]/tabs:duration-500 group-data-[indicator=ready]/tabs:ease-spring',
              )}
            />
            {children}
          </ul>
        </nav>
        {action && <div className="pointer-events-auto shrink-0">{action}</div>}
      </div>
    </div>
  )
}

type TabBarItemProps = useRender.ComponentProps<'a'> & {
  icon: ReactNode
  label: string
  active?: boolean
}

/**
 *   <TabBarItem render={<Link href="/" />} icon={<HouseIcon />} label="Home" active={pathname === '/'} />
 */
export const TabBarItem = ({ icon, label, active = false, render, className, ...props }: TabBarItemProps) => {
  const link = useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        className: cn(
          'flex h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-muted-foreground select-none',
          'transition-[color,transform] duration-200 ease-out active:scale-[0.95]',
          'hover:text-foreground aria-[current=page]:text-foreground',
          '[&_svg]:size-5 [&_svg]:shrink-0 aria-[current=page]:[&_svg]:text-primary-text',
          className,
        ),
        children: (
          <>
            {icon}
            <span className="max-w-full truncate text-[0.6875rem] leading-none font-medium">{label}</span>
          </>
        ),
      },
      props,
    ),
  })

  return (
    <li data-active={active ? '' : undefined} className="min-w-0">
      {link}
    </li>
  )
}
