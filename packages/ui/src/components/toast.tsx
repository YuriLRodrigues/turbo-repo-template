'use client'

import { CircleAlertIcon, CircleCheckIcon, InfoIcon } from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

import { useAppearance } from '../appearance/use-appearance'
import { Spinner } from './spinner'

export { toast } from 'sonner'

/**
 * Where toasts appear: short confirmations of something the person just did ("Note saved"), with an undo when the
 * action can be undone. Mount it once, at the root. It is the solid popover: readable over anything, for the few
 * seconds it stays.
 */
export const Toaster = (props: ToasterProps) => {
  const { appearance } = useAppearance()

  return (
    <Sonner
      theme={appearance.resolvedTheme}
      position="top-center"
      offset={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      mobileOffset={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      icons={{
        success: <CircleCheckIcon className="size-5 text-success-text" />,
        info: <InfoIcon className="size-5 text-primary-text" />,
        warning: <CircleAlertIcon className="size-5 text-warning-text" />,
        error: <CircleAlertIcon className="size-5 text-destructive-text" />,
        loading: <Spinner className="size-5" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          // `font-sans`: sonner sets a system font on its list, and the toast speaks with the voice of the app.
          toast:
            'flex w-full items-center gap-3 rounded-(--radius-card) bg-popover px-4 py-3.5 font-sans text-sm text-foreground shadow-elevation-lg inset-ring inset-ring-border',
          title: 'font-medium',
          description: 'text-muted-foreground',
          actionButton:
            'ml-auto inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full bg-primary-soft px-3 text-[0.8125rem] font-medium text-primary-text transition-transform active:scale-95',
          cancelButton:
            'ml-auto inline-flex h-8 shrink-0 cursor-pointer items-center rounded-full px-3 text-[0.8125rem] font-medium text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}
