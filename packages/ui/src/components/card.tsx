import type { ComponentProps, ReactNode } from 'react'

import { cn } from '../lib/cn'

/**
 * A surface that groups one thing: a stat, a list, a form. The shadcn anatomy, so a block copied from shadcn fits:
 *
 *   <Card>
 *     <CardHeader title="Pinned" description="Always on top of the list." action={<Button size="sm">New</Button>} />
 *     <CardContent>…</CardContent>
 *     <CardFooter>…</CardFooter>
 *   </Card>
 *
 * A card is a grid item more often than not: it never grows past its track (`min-w-0`), so a chart or a long row
 * inside it fits the track instead of widening it (docs/patterns/web/layout.md).
 */
export const Card = ({ className, ...props }: ComponentProps<'section'>) => (
  <section
    className={cn('flex min-w-0 flex-col gap-4 rounded-(--radius-card) surface py-5 text-card-foreground', className)}
    {...props}
  />
)

type CardHeaderProps = Omit<ComponentProps<'header'>, 'title'> & {
  title?: ReactNode
  description?: ReactNode
  /** Something on the right of the title: a button, a menu, a badge. */
  action?: ReactNode
}

export const CardHeader = ({ title, description, action, className, children, ...props }: CardHeaderProps) => (
  <header className={cn('grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 px-5', className)} {...props}>
    {title && <h2 className="font-display text-base leading-tight font-semibold">{title}</h2>}
    {action && <div className="row-span-2 flex items-center gap-2">{action}</div>}
    {description && <p className="col-start-1 text-sm text-pretty text-muted-foreground">{description}</p>}
    {children}
  </header>
)

export const CardContent = ({ className, ...props }: ComponentProps<'div'>) => (
  <div className={cn('min-w-0 px-5', className)} {...props} />
)

export const CardFooter = ({ className, ...props }: ComponentProps<'footer'>) => (
  <footer className={cn('flex items-center gap-2 px-5', className)} {...props} />
)
