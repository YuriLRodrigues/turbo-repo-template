'use client'

import { MoonIcon, SunIcon } from 'lucide-react'

import { useAppearance, useFollowAppearance } from '@workspace/ui/appearance'
import { IconButton } from '@workspace/ui/components/icon-button'

type ThemeToggleProps = {
  /** What the button does, in the language of the page: `dict.nav.useLight` and `dict.nav.useDark`. */
  labels: { light: string; dark: string }
}

/** Light or dark, the same choice the app keeps: one press flips it. "System" stays the default until then. */
export const ThemeToggle = ({ labels }: ThemeToggleProps) => {
  const { appearance, setAppearance } = useAppearance()
  useFollowAppearance()
  const dark = appearance.resolvedTheme === 'dark'

  return (
    <IconButton
      variant="ghost"
      size="sm"
      label={dark ? labels.light : labels.dark}
      onClick={() => setAppearance({ theme: dark ? 'light' : 'dark' })}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  )
}
