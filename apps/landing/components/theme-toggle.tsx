'use client'

import { MoonIcon, SunIcon } from 'lucide-react'

import { useAppearance, useFollowAppearance } from '@workspace/ui/appearance'
import { IconButton } from '@workspace/ui/components/icon-button'

/** Light or dark, the same choice the app keeps: one press flips it. "System" stays the default until then. */
export const ThemeToggle = () => {
  const { appearance, setAppearance } = useAppearance()
  useFollowAppearance()
  const dark = appearance.resolvedTheme === 'dark'

  return (
    <IconButton
      variant="ghost"
      size="sm"
      label={dark ? 'Use the light theme' : 'Use the dark theme'}
      onClick={() => setAppearance({ theme: dark ? 'light' : 'dark' })}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  )
}
