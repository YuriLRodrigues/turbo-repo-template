'use client'

import {
  type ComponentProps,
  createContext,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'

import { useSlidingIndicator } from '../hooks/use-sliding-indicator'
import { cn } from '../lib/cn'
import {
  followSidebar,
  getSidebar,
  SERVER_SIDEBAR,
  setSidebar,
  SIDEBAR_QUERY,
  type SidebarMode,
  type SidebarSnapshot,
  subscribeSidebar,
  toggleSidebar,
} from '../lib/sidebar-state'
import { buttonVariants } from './button'
import { ScrollArea } from './scroll-area'
import { Tooltip } from './tooltip'

/*
 * The navigation from 768px up: a panel floating beside the content that opens (names) and closes (a rail of icons).
 *
 * - From 1024px it pushes the content, starts open and remembers the person's choice on the device. Between 768px
 *   and 1023px it starts closed, and opening it lays it over the content until a destination is chosen, Escape is
 *   pressed or the content is pressed.
 * - The state is on <html> before the first paint (lib/sidebar-state.ts) and the stylesheet does the rest
 *   (styles/sidebar.css): the width, the names fading and sliding, the main action becoming square. React only mirrors it
 *   for what is not visual: `aria-expanded`, the tooltips of the closed rail, the name of the toggle.
 * - Ctrl/⌘+B toggles it from anywhere, except while typing in a field.
 */

const SHORTCUT_KEY = 'b'

type SidebarContextValue = {
  /** The id of the sidebar, for `aria-controls`. */
  id: string
  collapsed: boolean
  mode: SidebarMode
  toggle: () => void
  /** Closes the sidebar when it is lying over the content (768px to 1023px). From 1024px it does nothing. */
  dismiss: () => void
  toggleRef: RefObject<HTMLButtonElement | null>
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export const useSidebar = (): SidebarContextValue => {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used inside <SidebarProvider>')

  return context
}

const getServerSnapshot = (): SidebarSnapshot => SERVER_SIDEBAR

const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]') !== null

/** For two frames everything about the sidebar changes without animating (styles/sidebar.css). */
const withoutAnimation = (change: () => void): void => {
  const root = document.documentElement
  root.dataset.sidebarInstant = ''
  change()
  requestAnimationFrame(() => requestAnimationFrame(() => delete root.dataset.sidebarInstant))
}

/**
 * Holds the sidebar's state for everything around it: the sidebar, the toggle and the content that gives way
 * (`<SidebarInset>`). Mount it once, around the shell.
 */
export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const id = useId()
  const { state, mode } = useSyncExternalStore(subscribeSidebar, getSidebar, getServerSnapshot)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const collapsed = state === 'collapsed'
  const overlaid = mode === 'overlay' && !collapsed

  const dismiss = useCallback(() => {
    const current = getSidebar()
    if (current.mode === 'overlay' && current.state === 'expanded') setSidebar('collapsed')
  }, [])

  useEffect(() => {
    const stopFollowing = followSidebar()
    // Changes animate from now on: the first paint already showed the final state.
    document.documentElement.dataset.sidebarMotion = 'on'

    return () => {
      stopFollowing()
      delete document.documentElement.dataset.sidebarMotion
    }
  }, [])

  // Ctrl/⌘+B, the shortcut editors made familiar. A press on the keyboard is answered in the same frame.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== SHORTCUT_KEY || !(event.ctrlKey || event.metaKey)) return
      if (event.altKey || event.shiftKey || isTyping(event.target)) return
      // Under 768px there is no sidebar: the shortcut belongs to the browser.
      if (!window.matchMedia(SIDEBAR_QUERY).matches) return
      event.preventDefault()
      withoutAnimation(toggleSidebar)
    }
    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Lying over the content, Escape closes it and the focus goes back to the button that opened it.
  useEffect(() => {
    if (!overlaid) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setSidebar('collapsed')
      toggleRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [overlaid])

  const value = useMemo<SidebarContextValue>(
    () => ({ id, collapsed, mode, toggle: toggleSidebar, dismiss, toggleRef }),
    [id, collapsed, mode, dismiss],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

type SidebarProps = Omit<ComponentProps<'aside'>, 'id'> & {
  /** The accessible name of the navigation landmark inside: "Main navigation". */
  label: string
}

export const Sidebar = ({ label, className, children, onClick, ...props }: SidebarProps) => {
  const { id, dismiss } = useSidebar()

  // Choosing a destination closes the sidebar when it is over the content. A press with a modifier (open in a new
  // tab) does not. `defaultPrevented` says nothing here: a client-side <Link> always cancels the click.
  const dismissOnNavigate = (event: MouseEvent<HTMLElement>) => {
    onClick?.(event)
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if ((event.target as HTMLElement).closest('a[href]')) dismiss()
  }

  return (
    <>
      <div aria-hidden className="sidebar-scrim" onClick={dismiss} />
      <aside
        id={id}
        className={cn('sidebar rounded-(--radius-sheet) border border-border bg-card shadow-elevation', className)}
        onClick={dismissOnNavigate}
        {...props}
      >
        <nav aria-label={label} className="flex min-h-0 flex-1 flex-col">
          {children}
        </nav>
      </aside>
    </>
  )
}

/** The content beside the sidebar: it gives way to it, and follows its width while it opens and closes. */
export const SidebarInset = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('sidebar-inset', className)} {...props} />
)

/**
 * The top of the sidebar: the brand on the left and the toggle on the right. Closed, the brand steps out and the
 * toggle ends up in its place, at the top of the rail.
 */
export const SidebarHeader = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('relative flex h-16 shrink-0 items-center px-4', className)} {...props} />
)

/**
 * The brand in the header (a link to the start). It leaves the screen and the Tab order when the sidebar closes. It
 * is out of the flow, so the toggle beside it is placed by the width of the sidebar alone.
 */
export const SidebarBrand = ({ render, className, ...props }: useRender.ComponentProps<'a'>) =>
  useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      { className: cn('sidebar-label sidebar-hide absolute inset-y-0 left-4 flex items-center', className) },
      props,
    ),
  })

type SidebarToggleProps = {
  /** The names of the button, which say what a press will do. */
  collapseLabel?: string
  expandLabel?: string
  className?: string
}

/**
 * Opens and closes the sidebar (the same as Ctrl/⌘+B). Its icon and its name say what the press will do, and its
 * tooltip shows the shortcut.
 */
export const SidebarToggle = ({
  collapseLabel = 'Collapse sidebar',
  expandLabel = 'Expand sidebar',
  className,
}: SidebarToggleProps) => {
  const { id, collapsed, toggle, toggleRef } = useSidebar()
  const label = collapsed ? expandLabel : collapseLabel

  return (
    <Tooltip label={label} shortcut={['Ctrl', 'B']} side="right">
      <button
        ref={toggleRef}
        type="button"
        aria-label={label}
        aria-expanded={!collapsed}
        aria-controls={id}
        onClick={toggle}
        className={cn(
          'ml-auto grid size-9 shrink-0 cursor-pointer place-items-center rounded-(--radius-control) text-muted-foreground select-none',
          'transition-[color,background-color,transform] duration-200 ease-out hover:bg-muted hover:text-foreground active:scale-[0.92] active:bg-muted-hover',
          className,
        )}
      >
        <PanelLeftCloseIcon aria-hidden className="sidebar-toggle-collapse size-5" />
        <PanelLeftOpenIcon aria-hidden className="sidebar-toggle-expand size-5" />
      </button>
    </Tooltip>
  )
}

type SidebarActionProps = Omit<ComponentProps<'button'>, 'children'> & {
  icon: ReactNode
  label: string
}

/**
 * The main action of the app in the sidebar ("New note"): a full-width button while the sidebar is open, a square
 * button with the same icon when it is closed.
 */
export const SidebarAction = ({ icon, label, className, ...props }: SidebarActionProps) => {
  const { collapsed } = useSidebar()

  return (
    <div className="shrink-0 px-3 pb-3">
      <div className="sidebar-action">
        <Tooltip label={label} side="right" disabled={!collapsed}>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'primary' }), 'w-full gap-0 overflow-hidden px-0', className)}
            {...props}
          >
            {icon}
            {/* The space before the name is inside the part that collapses: closed, only the icon is left, and it
                sits in the middle of the round button. */}
            <span className="sidebar-collapse">
              <span>
                <span className="sidebar-label block pl-2">{label}</span>
              </span>
            </span>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

type SidebarGroupProps = {
  /** Whatever changes when the active item changes (the pathname): the highlight slides when it does. */
  activeKey: string
  /** The accessible name of the list while it scrolls (a short window): "Sections". */
  label?: string
  children: ReactNode
  className?: string
}

/** A list of items with one highlight that slides to the active one. It scrolls when the window is short. */
export const SidebarGroup = ({ activeKey, label = 'Sections', children, className }: SidebarGroupProps) => {
  const listRef = useRef<HTMLUListElement>(null)
  useSlidingIndicator(listRef, '[data-active]', activeKey)

  return (
    <ScrollArea label={label} fade className="min-h-0 flex-1" viewportClassName="px-3 py-1">
      <ul ref={listRef} className={cn('group/side relative isolate flex flex-col gap-1', className)}>
        <li
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-0 left-0 -z-10 rounded-(--radius-control) bg-muted opacity-0',
            'h-(--indicator-height) w-(--indicator-width) translate-x-(--indicator-x) translate-y-(--indicator-y)',
            'group-data-[indicator]/side:opacity-100',
            'group-data-[indicator=ready]/side:transition-[translate,height] group-data-[indicator=ready]/side:duration-500 group-data-[indicator=ready]/side:ease-spring',
          )}
        />
        {children}
      </ul>
    </ScrollArea>
  )
}

/*
 * A row of the sidebar. The icon keeps its place whether the sidebar is open or closed (it sits in the middle of the
 * rail), so nothing jumps while the width changes: the name beside it only fades.
 */
const rowClass = cn(
  'flex h-10 w-full items-center gap-3 overflow-hidden rounded-(--radius-control) pr-3 pl-[0.8125rem] text-left text-sm font-medium text-muted-foreground select-none',
  'transition-[color,background-color,transform] duration-200 ease-out active:scale-[0.98]',
  'hover:text-foreground [&_svg]:size-[1.125rem] [&_svg]:shrink-0',
)

type SidebarItemProps = useRender.ComponentProps<'a'> & {
  icon: ReactNode
  label: string
  active?: boolean
  /** A small note on the right while the names show: "soon", a count. */
  trailing?: ReactNode
}

/**
 *   <SidebarItem render={<Link href="/" />} icon={<HouseIcon />} label="Home" active={pathname === '/'} />
 *
 * Closed, the item is its icon and a tooltip says its name on hover and on focus.
 */
export const SidebarItem = ({
  icon,
  label,
  active = false,
  trailing,
  render,
  className,
  ...props
}: SidebarItemProps) => {
  const { collapsed } = useSidebar()
  const link = useRender({
    defaultTagName: 'a',
    render,
    props: mergeProps<'a'>(
      {
        'aria-current': active ? 'page' : undefined,
        className: cn(
          rowClass,
          'aria-[current=page]:text-foreground aria-[current=page]:[&_svg]:text-primary-text',
          'not-aria-[current=page]:hover:bg-muted',
          className,
        ),
        children: (
          <>
            {icon}
            <span className="sidebar-label min-w-0 flex-1 truncate">{label}</span>
            {trailing && <span className="sidebar-label shrink-0">{trailing}</span>}
          </>
        ),
      },
      props,
    ),
  })

  return (
    <li data-active={active ? '' : undefined}>
      <Tooltip label={label} side="right" disabled={!collapsed}>
        {link}
      </Tooltip>
    </li>
  )
}

export const SidebarFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex shrink-0 flex-col gap-1 p-3', className)} {...props} />
)

type SidebarButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  icon: ReactNode
  label: string
}

/** A row that does something instead of going somewhere ("Appearance"). Closed, it is its icon with a tooltip. */
export const SidebarButton = ({ icon, label, className, ...props }: SidebarButtonProps) => {
  const { collapsed } = useSidebar()

  return (
    <Tooltip label={label} side="right" disabled={!collapsed}>
      <button type="button" className={cn(rowClass, 'cursor-pointer hover:bg-muted', className)} {...props}>
        {icon}
        <span className="sidebar-label min-w-0 flex-1 truncate">{label}</span>
      </button>
    </Tooltip>
  )
}

type SidebarUserProps = {
  /** What stands for the person in the round mark: initials, or a picture. */
  avatar: ReactNode
  name: string
  description?: string
  className?: string
}

/** Who is using the app: the round mark, with the name beside it while the sidebar is open. */
export const SidebarUser = ({ avatar, name, description, className }: SidebarUserProps) => {
  const { collapsed } = useSidebar()

  return (
    <Tooltip label={name} side="right" disabled={!collapsed}>
      <div
        className={cn(
          'flex items-center gap-3 overflow-hidden rounded-(--radius-control) py-1.5 pr-3 pl-1.5',
          className,
        )}
      >
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-text"
        >
          {avatar}
        </span>
        <span className="sidebar-label min-w-0">
          <span className="block truncate text-sm leading-tight font-medium">{name}</span>
          {description && <span className="block truncate text-xs text-muted-foreground">{description}</span>}
        </span>
      </div>
    </Tooltip>
  )
}
