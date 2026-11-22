'use client'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/cn'
import { Spinner } from './spinner'

/*
 * Every button answers the hand: it sinks a little when pressed and shows the focus ring from the keyboard (the ring
 * itself is the global `:focus-visible` rule in base.css).
 */
export const buttonVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-(--radius-control) font-medium whitespace-nowrap select-none',
    'transition-[transform,box-shadow,background-color,border-color,color,filter] duration-150 ease-out',
    'active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        /* The accent: the one main action of a screen or a form. */
        primary: 'bg-primary text-primary-foreground shadow-elevation-sm hover:brightness-110 dark:hover:brightness-95',
        /* A surface: actions next to a primary one. */
        secondary: 'surface text-foreground hover:border-border-strong hover:bg-muted',
        /* The accent as a tint: selected filters, quiet calls to action. */
        soft: 'bg-primary-soft text-primary-text hover:brightness-95 dark:hover:brightness-125',
        ghost: 'text-foreground hover:bg-muted active:bg-muted-hover',
        destructive: 'bg-destructive text-destructive-foreground shadow-elevation-sm hover:brightness-110',
        link: 'h-auto rounded-md px-0 text-primary-text underline-offset-4 hover:underline active:scale-100',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonProps = useRender.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** The action is running: the button is disabled and shows a spinner before its label. */
    loading?: boolean
  }

/**
 *   <Button onClick={save}>Save note</Button>
 *   <Button variant="secondary" render={<Link href="/notes" />}>See all</Button>
 */
export const Button = ({ variant, size, loading = false, render, className, children, ...props }: ButtonProps) =>
  useRender({
    defaultTagName: 'button',
    render,
    props: mergeProps<'button'>(
      {
        type: render ? undefined : 'button',
        className: cn(buttonVariants({ variant, size }), className),
        'aria-busy': loading || undefined,
        disabled: loading || undefined,
        children: (
          <>
            {loading && <Spinner />}
            {children}
          </>
        ),
      },
      props,
    ),
  })
