import { cn } from '../lib/cn'

/** A turning arc for "this is running". It takes the color and the size of the text around it. */
export const Spinner = ({ className }: { className?: string }) => (
  <svg aria-hidden viewBox="0 0 24 24" fill="none" className={cn('size-[1.15em] animate-spin-slow', className)}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)
