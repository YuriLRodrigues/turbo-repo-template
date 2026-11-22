'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Whether a media query matches. On the server and during hydration it answers `serverValue`, so the first client
 * render is the same HTML; the real answer follows.
 */
export const useMediaQuery = (query: string, serverValue = false): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)

      return () => media.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

/** The queries the system answers the same way everywhere. */
export const MEDIA = {
  reducedMotion: '(prefers-reduced-motion: reduce)',
  /** From here up the bottom tab bar gives way to the sidebar (closed to its rail of icons by default). */
  tablet: '(min-width: 768px)',
  /** From here up the sidebar starts open and pushes the content instead of lying over it. */
  desktop: '(min-width: 1024px)',
  hover: '(hover: hover)',
} as const
