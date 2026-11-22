import type { ComponentProps, ReactNode } from 'react'

import { cn } from '../lib/cn'

/**
 * The layout of one form field: the label on top, the control, then a hint or the error. The pieces are separate so
 * a field wired to react-hook-form (apps/web: components/form) decides what goes where.
 *
 *   <Field>
 *     <Label htmlFor="email">E-mail</Label>
 *     <Input id="email" aria-invalid={invalid} aria-describedby="email-error" />
 *     <FieldError id="email-error">Enter a valid e-mail.</FieldError>
 *   </Field>
 */
export const Field = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('flex min-w-0 flex-col gap-2', className)} {...props} />
)

export const FieldDescription = ({ className, ...props }: ComponentProps<'p'>) => (
  <p className={cn('text-[0.8125rem] leading-snug text-pretty text-muted-foreground', className)} {...props} />
)

type FieldErrorProps = Omit<ComponentProps<'p'>, 'children'> & { children?: ReactNode }

/** The message of an invalid field. Announced as it appears (`role="alert"`); nothing renders without a message. */
export const FieldError = ({ className, children, ...props }: FieldErrorProps) =>
  children ? (
    <p
      role="alert"
      className={cn('text-[0.8125rem] leading-snug font-medium text-destructive-text', className)}
      {...props}
    >
      {children}
    </p>
  ) : null
