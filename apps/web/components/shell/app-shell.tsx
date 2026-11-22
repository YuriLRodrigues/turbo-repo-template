'use client'

import { type ReactNode, useMemo, useState } from 'react'

import { SidebarInset, SidebarProvider } from '@workspace/ui/components/sidebar'

import { AppearancePanel } from '@/components/appearance/appearance-panel'
import { usePreferencesSync } from '@/components/appearance/use-preferences-sync'
import { NoteSheet } from '@/components/notes/note-sheet'

import { AppSidebar } from './app-sidebar'
import { AppTabBar } from './app-tab-bar'
import { ShellContext } from './shell-context'

/**
 * What is around every signed-in screen: the navigation (a bottom tab bar under 768px; from there up a sidebar that
 * opens and closes), the "+" that writes a note from anywhere, and the two sheets that belong to no screen in
 * particular (the new note and the appearance).
 *
 * Safe areas: the content starts below the notch and ends above the tab bar and the home indicator
 * (`env(safe-area-inset-*)`; the viewport is declared with `viewport-fit=cover` in the root layout).
 */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const [newNoteOpen, setNewNoteOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  usePreferencesSync()

  const shell = useMemo(
    () => ({ openNewNote: () => setNewNoteOpen(true), openAppearance: () => setAppearanceOpen(true) }),
    [],
  )

  return (
    <ShellContext.Provider value={shell}>
      <SidebarProvider>
        <AppSidebar />

        {/* The content gives way to the sidebar and follows its width while it opens and closes. */}
        <SidebarInset>
          <main className="mx-auto min-h-svh w-full max-w-6xl px-4 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] sm:px-6 md:px-8 md:pt-8 md:pb-12">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>

      <AppTabBar />

      <NoteSheet open={newNoteOpen} onOpenChange={setNewNoteOpen} />
      <AppearancePanel open={appearanceOpen} onOpenChange={setAppearanceOpen} />
    </ShellContext.Provider>
  )
}
