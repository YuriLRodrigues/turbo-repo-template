'use client'

import { type ComponentProps, createContext, type ReactNode, useContext } from 'react'

import { Drawer } from '@base-ui/react/drawer'
import { XIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { IconButton } from './icon-button'

type Side = 'bottom' | 'right'

const SheetSideContext = createContext<Side>('bottom')

type SheetProps = Omit<Drawer.Root.Props, 'swipeDirection'> & {
  /**
   * `bottom` (default): a bottom sheet on phones, swiped down to dismiss; from 640px it is a centered dialog.
   * `right`: a panel on the right edge from 640px (and a bottom sheet on phones too).
   */
  side?: Side
}

/**
 * The surface for a focused task over the current screen: a form, a picker, the appearance control. Built on Base
 * UI's Drawer: focus is trapped and returned, Escape and an outside press close it, and on touch it follows the
 * finger.
 *
 *   <Sheet open={open} onOpenChange={setOpen}>
 *     <SheetContent>
 *       <SheetHeader title="New note" />
 *       …
 *     </SheetContent>
 *   </Sheet>
 */
export const Sheet = ({ side = 'bottom', ...props }: SheetProps) => (
  <SheetSideContext.Provider value={side}>
    {/* On phones every sheet comes from the bottom, so the gesture that dismisses it is always "down". */}
    <Drawer.Root swipeDirection="down" {...props} />
  </SheetSideContext.Provider>
)

export const SheetTrigger = Drawer.Trigger
export const SheetClose = Drawer.Close

type SheetContentProps = Omit<ComponentProps<typeof Drawer.Popup>, 'className'> & {
  className?: string
  /** `dim` darkens the screen behind. `clear` leaves it visible: for controls whose effect is the screen itself. */
  backdrop?: 'dim' | 'clear'
  children: ReactNode
}

export const SheetContent = ({ className, backdrop = 'dim', children, ...props }: SheetContentProps) => {
  const side = useContext(SheetSideContext)

  return (
    <Drawer.Portal>
      <Drawer.Backdrop
        className={cn(
          'fixed inset-0 z-50 min-h-dvh opacity-[calc(1-var(--drawer-swipe-progress,0))]',
          'transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0',
          backdrop === 'dim' ? 'bg-scrim' : 'bg-transparent',
        )}
      />
      <Drawer.Viewport
        className={cn(
          'fixed inset-0 z-50 flex items-end justify-center',
          side === 'right' ? 'sm:items-stretch sm:justify-end sm:p-3' : 'sm:items-center sm:p-6',
        )}
      >
        <Drawer.Popup
          data-side={side}
          className={cn(
            'group/sheet flex w-full flex-col border border-border bg-popover text-foreground shadow-elevation-xl outline-none',
            // Phones: attached to the bottom edge, following the finger. It is 3rem taller than it looks, with that
            // much hidden under the edge: its bottom corners never show, and a pull upwards uncovers the sheet, not
            // a gap.
            '-mb-12 max-h-[calc(100dvh-env(safe-area-inset-top,0px)+1.5rem)] rounded-t-(--radius-sheet) pb-12',
            '[transform:translateY(var(--drawer-swipe-movement-y,0px))]',
            'transition-[transform,opacity] duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
            'data-ending-style:[transform:translateY(105%)] data-starting-style:[transform:translateY(105%)]',
            'data-ending-style:duration-[calc(var(--drawer-swipe-strength,1)*350ms)] data-swiping:duration-0 data-swiping:select-none',
            // From 640px: a floating panel that scales in, centered or on the right edge.
            'sm:mb-0 sm:rounded-(--radius-sheet) sm:pb-0',
            side === 'right'
              ? 'sm:h-full sm:max-h-none sm:max-w-[24rem] sm:data-ending-style:[transform:translateX(calc(100%+1rem))] sm:data-starting-style:[transform:translateX(calc(100%+1rem))]'
              : 'sm:max-h-[min(44rem,calc(100dvh-3rem))] sm:max-w-[30rem] sm:data-ending-style:[transform:translateY(0.75rem)_scale(0.97)] sm:data-ending-style:opacity-0 sm:data-starting-style:[transform:translateY(0.75rem)_scale(0.97)] sm:data-starting-style:opacity-0',
            className,
          )}
          {...props}
        >
          {/* The grabber: says "this can be dragged down" on touch. */}
          <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border-strong sm:hidden" />
          <Drawer.Content className="flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom,0px)]">
            {children}
          </Drawer.Content>
        </Drawer.Popup>
      </Drawer.Viewport>
    </Drawer.Portal>
  )
}

type SheetHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** The accessible name of the close button. */
  closeLabel?: string
  className?: string
}

/** The title of the sheet (its accessible name) and the close button. */
export const SheetHeader = ({ title, description, closeLabel = 'Close', className }: SheetHeaderProps) => (
  <div className={cn('flex items-start justify-between gap-4 px-5 pt-4 pb-3 sm:px-6 sm:pt-5', className)}>
    <div className="min-w-0">
      <Drawer.Title className="font-display text-lg leading-tight font-semibold tracking-[-0.01em]">
        {title}
      </Drawer.Title>
      {description && (
        <Drawer.Description className="mt-1 text-sm text-pretty text-muted-foreground">
          {description}
        </Drawer.Description>
      )}
    </div>
    <Drawer.Close render={<IconButton variant="ghost" size="sm" label={closeLabel} className="-mr-1.5" />}>
      <XIcon />
    </Drawer.Close>
  </div>
)

/** The actions of the sheet, kept at the bottom above the safe area. */
export const SheetFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex flex-col gap-2 px-5 pt-3 pb-5 sm:px-6 sm:pb-6', className)} {...props} />
)
