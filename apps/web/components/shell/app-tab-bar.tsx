'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { PlusIcon } from 'lucide-react'

import { IconButton } from '@workspace/ui/components/icon-button'
import { TabBar, TabBarItem } from '@workspace/ui/components/tab-bar'

import { isActivePath, NAVIGATION, normalizePath } from './navigation'
import { useShell } from './shell-context'

/**
 * The navigation under 768px: the places of the app in a bar above the home indicator, and beside it the round "+"
 * that writes a new note from any screen. The "+" is docked in the row of the bar: it never sits over a list.
 */
export const AppTabBar = () => {
  const pathname = usePathname()
  const { openNewNote } = useShell()

  return (
    <TabBar
      label="Main navigation"
      activeKey={normalizePath(pathname)}
      className="md:hidden"
      action={
        <IconButton variant="primary" size="lg" label="New note" onClick={openNewNote} className="rounded-2xl">
          <PlusIcon strokeWidth={2.5} />
        </IconButton>
      }
    >
      {NAVIGATION.map(({ href, label, icon: Icon }) => (
        <TabBarItem
          key={href}
          render={<Link href={href} />}
          icon={<Icon aria-hidden />}
          label={label}
          active={isActivePath(pathname, href)}
        />
      ))}
    </TabBar>
  )
}
