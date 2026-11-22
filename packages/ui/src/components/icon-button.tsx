'use client'

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/cn'

export const iconButtonVariants = cva(
  [
    'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-(--radius-control) select-none',
    'transition-[transform,box-shadow,background-color,border-color,color,filter] duration-150 ease-out',
    'active:scale-[0.94]',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[1.125rem]",
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground shadow-elevation-sm hover:brightness-110 dark:hover:brightness-95',
        secondary: 'surface text-foreground hover:border-border-strong hover:bg-muted',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted-hover',
        soft: 'bg-primary-soft text-primary-text hover:brightness-95 dark:hover:brightness-125',
      },
      size: {
        sm: 'size-8',
        md: 'size-10',
        /* 48px: a comfortable touch target for the one action of a phone screen. */
        lg: 'size-12 [&_svg:not([class*=size-])]:size-5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

type IconButtonProps = Omit<useRender.ComponentProps<'button'>, 'aria-label'> &
  VariantProps<typeof iconButtonVariants> & {
    /** What the button does, for screen readers and as the native tooltip: an icon alone says nothing. */
    label: string
  }

/**
 *   <IconButton label="Previous page" onClick={previous}><ChevronLeftIcon /></IconButton>
 */
export const IconButton = ({ variant, size, label, render, className, ...props }: IconButtonProps) =>
  useRender({
    defaultTagName: 'button',
    render,
    props: mergeProps<'button'>(
      {
        type: render ? undefined : 'button',
        'aria-label': label,
        title: label,
        className: cn(iconButtonVariants({ variant, size }), className),
      },
      props,
    ),
  })
