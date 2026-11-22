'use client'

import type { ComponentProps, ReactNode } from 'react'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'

import { cn } from '../lib/cn'
import { Button } from './button'
import { IconButton } from './icon-button'

/**
 * A modal question in the middle of the screen (Base UI Dialog: focus trapped and returned, Escape and an outside
 * press close it). For a task with fields, a `Sheet` is usually better on phones; a dialog is for a short decision.
 *
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent title="Delete the note?" description="It cannot be undone.">…</DialogContent>
 *   </Dialog>
 */
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

type DialogContentProps = Omit<ComponentProps<typeof DialogPrimitive.Popup>, 'className' | 'title'> & {
  title: ReactNode
  description?: ReactNode
  /** The accessible name of the close button. */
  closeLabel?: string
  className?: string
  children?: ReactNode
}

export const DialogContent = ({
  title,
  description,
  closeLabel = 'Close',
  className,
  children,
  ...props
}: DialogContentProps) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-scrim transition-opacity duration-200 ease-out',
        'data-ending-style:opacity-0 data-starting-style:opacity-0',
      )}
    />
    <DialogPrimitive.Popup
      className={cn(
        'fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4',
        'rounded-(--radius-sheet) border border-border bg-popover p-5 text-foreground shadow-elevation-xl outline-none sm:p-6',
        'transition-[opacity,scale] duration-200 ease-out data-ending-style:scale-95 data-ending-style:opacity-0',
        'data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <DialogPrimitive.Title className="font-display text-lg leading-tight font-semibold">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="mt-1.5 text-sm text-pretty text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        <DialogPrimitive.Close
          render={<IconButton variant="ghost" size="sm" label={closeLabel} className="-mt-1 -mr-1.5" />}
        >
          <XIcon />
        </DialogPrimitive.Close>
      </div>
      {children}
    </DialogPrimitive.Popup>
  </DialogPrimitive.Portal>
)

/** The buttons of a dialog: the main one last, on the right; stacked on phones with the main one on top. */
export const DialogFooter = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />
)

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** `destructive` for something that cannot be undone. */
  tone?: 'primary' | 'destructive'
  /** The action is running: the confirm button shows a spinner and nothing can be pressed twice. */
  pending?: boolean
  onConfirm: () => void
}

/** "Are you sure?": the dialog every irreversible action asks before it runs. */
export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  tone = 'primary',
  pending = false,
  onConfirm,
}: ConfirmDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent title={title} description={description}>
      <DialogFooter>
        <DialogClose render={<Button variant="secondary" disabled={pending} />}>{cancelLabel}</DialogClose>
        <Button variant={tone} loading={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
