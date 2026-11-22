'use client'

import { useEffect, useSyncExternalStore } from 'react'

import {
  type AppearanceState,
  followAppearance,
  getAppearance,
  SERVER_APPEARANCE,
  setAppearance,
  subscribeAppearance,
} from './appearance'

const getServerSnapshot = (): AppearanceState => SERVER_APPEARANCE

/**
 * The current look and the function that changes it. On the server (and during hydration) it is the default; the
 * real one arrives right after, and the page itself was already painted right by the inline script.
 */
export const useAppearance = () => {
  const appearance = useSyncExternalStore(subscribeAppearance, getAppearance, getServerSnapshot)

  return { appearance, setAppearance }
}

/** Mount once, near the root: keeps "system" following the system and tabs following each other. */
export const useFollowAppearance = (): void => {
  useEffect(() => followAppearance(), [])
}
