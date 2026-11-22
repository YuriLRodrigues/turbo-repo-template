'use client'

import { createContext, useContext } from 'react'

type ShellActions = {
  /** Opens the sheet that writes a new note, from any screen. */
  openNewNote: () => void
  /** Opens the appearance control. */
  openAppearance: () => void
}

export const ShellContext = createContext<ShellActions | null>(null)

/** What any screen can ask of the shell around it. */
export const useShell = (): ShellActions => {
  const shell = useContext(ShellContext)
  if (!shell) throw new Error('useShell must be used inside <AppShell>')

  return shell
}
