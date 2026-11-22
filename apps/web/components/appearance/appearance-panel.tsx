'use client'

import { AppearanceControls } from '@workspace/ui/components/appearance-controls'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { Sheet, SheetContent, SheetHeader } from '@workspace/ui/components/sheet'

import { useSaveAppearance } from './use-preferences-sync'

type AppearancePanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * The look of the app, changed live: theme, accent, density and "reduce motion" (the controls themselves are
 * `AppearanceControls`, in the design system). Each change is applied at once, remembered on this device and saved
 * in the account, so it follows the person to other devices.
 *
 * The sheet is not modal and has no scrim, because what it changes is the screen behind it: a panel on the right
 * from 640px, a bottom sheet that leaves the top of the screen in view on phones.
 */
export const AppearancePanel = ({ open, onOpenChange }: AppearancePanelProps) => {
  const save = useSaveAppearance()

  return (
    <Sheet side="right" modal={false} disablePointerDismissal open={open} onOpenChange={onOpenChange}>
      <SheetContent backdrop="clear" className="max-h-[calc(64dvh+3rem)] sm:max-h-none">
        <SheetHeader title="Appearance" description="Changes at once and follows your account." />
        <ScrollArea label="Appearance options" fade className="flex-1" viewportClassName="px-5 pt-2 pb-6 sm:px-6">
          <AppearanceControls onChange={save} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
