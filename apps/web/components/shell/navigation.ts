import { ChartColumnIcon, HouseIcon, type LucideIcon, NotebookPenIcon, SettingsIcon } from 'lucide-react'

export type NavigationItem = {
  href: string
  /** The short name, under the icon in the tab bar. */
  label: string
  /** The full name, in the sidebar. */
  title: string
  icon: LucideIcon
}

/** The places of the app, in the order of the tab bar and of the sidebar. A new screen adds its line here. */
export const NAVIGATION: readonly NavigationItem[] = [
  { href: '/', label: 'Home', title: 'Home', icon: HouseIcon },
  { href: '/notes', label: 'Notes', title: 'Notes', icon: NotebookPenIcon },
  { href: '/charts', label: 'Charts', title: 'Charts', icon: ChartColumnIcon },
  { href: '/settings', label: 'Settings', title: 'Settings', icon: SettingsIcon },
]

/** `/notes/` (the export writes trailing slashes) and `/notes` are the same place. */
export const normalizePath = (pathname: string): string => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/')

/** A place is active on its own path and on the paths under it (`/notes` for `/notes/123`); home only on itself. */
export const isActivePath = (pathname: string, href: string): boolean => {
  const path = normalizePath(pathname)

  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`)
}
