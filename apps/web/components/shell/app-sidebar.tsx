'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogOutIcon, PaletteIcon, PlusIcon } from 'lucide-react'

import {
  Sidebar,
  SidebarAction,
  SidebarBrand,
  SidebarButton,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarToggle,
  SidebarUser,
  useSidebar,
} from '@workspace/ui/components/sidebar'
import { initialsOf } from '@workspace/utils'

import { useSession } from '@/components/session/session-provider'
import { Brand } from '@/components/shell/brand'
import { siteConfig } from '@/config/site'

import { isActivePath, NAVIGATION, normalizePath } from './navigation'
import { useShell } from './shell-context'

/**
 * The navigation from 768px: a floating sidebar that opens (names) and closes (a rail of icons), by its button or by
 * Ctrl/⌘+B. It also carries what the phone has beside the tab bar: the button that writes a new note.
 */
export const AppSidebar = () => {
  const pathname = usePathname()
  const { openAppearance, openNewNote } = useShell()
  const { dismiss } = useSidebar()
  const { user, signOut } = useSession()

  // What opens a sheet first closes the sidebar if it is lying over the content: one layer at a time.
  const leaving = (action: () => void) => () => {
    dismiss()
    action()
  }

  return (
    <Sidebar label="Main navigation">
      <SidebarHeader>
        <SidebarBrand render={<Link href="/" aria-label={`${siteConfig.name}, go home`} />}>
          <Brand />
        </SidebarBrand>
        <SidebarToggle />
      </SidebarHeader>

      <SidebarAction icon={<PlusIcon aria-hidden />} label="New note" onClick={leaving(openNewNote)} />

      <SidebarGroup activeKey={normalizePath(pathname)}>
        {NAVIGATION.map(({ href, title, icon: Icon }) => (
          <SidebarItem
            key={href}
            render={<Link href={href} />}
            icon={<Icon aria-hidden />}
            label={title}
            active={isActivePath(pathname, href)}
          />
        ))}
      </SidebarGroup>

      <SidebarFooter>
        <SidebarButton icon={<PaletteIcon aria-hidden />} label="Appearance" onClick={leaving(openAppearance)} />
        <SidebarButton icon={<LogOutIcon aria-hidden />} label="Sign out" onClick={() => void signOut()} />
        {user && <SidebarUser avatar={initialsOf(user.name)} name={user.name} description={user.email} />}
      </SidebarFooter>
    </Sidebar>
  )
}
