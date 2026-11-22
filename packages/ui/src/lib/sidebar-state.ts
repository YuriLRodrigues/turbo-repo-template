/*
 * Whether the sidebar is expanded (labels) or collapsed (a rail of icons), outside React. Like the appearance, the
 * answer lives on <html> as `data-*` attributes that the stylesheet reads (src/styles/sidebar.css), is written
 * before the first paint by the head script and is mirrored into React by `useSidebar` (components/sidebar.tsx).
 *
 *   data-sidebar-state="expanded | collapsed"   what is on screen
 *   data-sidebar-mode="push | overlay"          what an expanded sidebar does to the content
 *
 * From 1024px the sidebar pushes the content, it starts expanded and the person's last choice is remembered on the
 * device. Between 768px and 1023px there is no room to push: it starts collapsed, and expanding it lays it over
 * the content for a moment (it closes on navigation, Escape or a press outside), which is not something to restore
 * on the next visit. Under 768px there is no sidebar at all.
 */

export const SIDEBAR_STORAGE_KEY = 'app.sidebar'

/** From here up the sidebar pushes the content and remembers the choice. */
export const SIDEBAR_PUSH_QUERY = '(min-width: 1024px)'
/** From here up there is a sidebar (below it, the tab bar). */
export const SIDEBAR_QUERY = '(min-width: 768px)'

export type SidebarState = 'expanded' | 'collapsed'
export type SidebarMode = 'push' | 'overlay'
export type SidebarSnapshot = { state: SidebarState; mode: SidebarMode }

/** What the server renders: the default of a wide screen. The head script corrects it before anything paints. */
export const SERVER_SIDEBAR: SidebarSnapshot = { state: 'expanded', mode: 'push' }

let overlayOpen = false
let snapshot: SidebarSnapshot | undefined
const listeners = new Set<() => void>()

const readChoice = (): SidebarState | null => {
  try {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)

    return stored === 'expanded' || stored === 'collapsed' ? stored : null
  } catch {
    // Private mode or blocked storage: the default applies.
    return null
  }
}

const resolve = (): SidebarSnapshot =>
  window.matchMedia(SIDEBAR_PUSH_QUERY).matches
    ? { state: readChoice() ?? 'expanded', mode: 'push' }
    : { state: overlayOpen ? 'expanded' : 'collapsed', mode: 'overlay' }

const write = (next: SidebarSnapshot): void => {
  const root = document.documentElement
  root.dataset.sidebarState = next.state
  root.dataset.sidebarMode = next.mode
}

const refresh = (): void => {
  const next = resolve()
  if (snapshot && snapshot.state === next.state && snapshot.mode === next.mode) return
  snapshot = next
  write(next)
  listeners.forEach((listener) => listener())
}

export const subscribeSidebar = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/** The current answer. The first call takes over from the head script. */
export const getSidebar = (): SidebarSnapshot => {
  if (!snapshot) {
    snapshot = resolve()
    write(snapshot)
  }

  return snapshot
}

/** Expands or collapses. From 1024px the choice is remembered; below it, expanded is the overlay of this moment. */
export const setSidebar = (state: SidebarState): void => {
  if (window.matchMedia(SIDEBAR_PUSH_QUERY).matches) {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, state)
    } catch {
      // The choice still applies to this visit, through the attribute.
    }
    snapshot = { state, mode: 'push' }
    write(snapshot)
    listeners.forEach((listener) => listener())

    return
  }
  overlayOpen = state === 'expanded'
  refresh()
}

export const toggleSidebar = (): void => setSidebar(getSidebar().state === 'expanded' ? 'collapsed' : 'expanded')

/** Follows the width of the window across 1024px, and a choice made in another tab. */
export const followSidebar = (): (() => void) => {
  const media = window.matchMedia(SIDEBAR_PUSH_QUERY)
  const onWidth = () => {
    // An overlay does not survive the change of layout.
    overlayOpen = false
    snapshot = undefined
    refresh()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.key !== SIDEBAR_STORAGE_KEY) return
    snapshot = undefined
    refresh()
  }
  media.addEventListener('change', onWidth)
  window.addEventListener('storage', onStorage)

  return () => {
    media.removeEventListener('change', onWidth)
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * The part of the head script that sets the sidebar before anything paints: the same logic as `resolve` and `write`
 * above, without the imports. See lib/boot-script.ts.
 */
export const SIDEBAR_SCRIPT = `(function(){var s=document.documentElement.dataset,c=null;try{c=window.localStorage.getItem('${SIDEBAR_STORAGE_KEY}')}catch(e){}var w=window.matchMedia('${SIDEBAR_PUSH_QUERY}').matches;s.sidebarState=w?(c==='collapsed'?'collapsed':'expanded'):'collapsed';s.sidebarMode=w?'push':'overlay'})()`
