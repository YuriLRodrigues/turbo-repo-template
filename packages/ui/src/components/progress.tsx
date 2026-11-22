import type { CSSProperties } from 'react'

import { cn } from '../lib/cn'

type ProgressProps = {
  /** What is progressing, for screen readers: "Profile completed". */
  label: string
  value: number
  max?: number
  /** How a screen reader says the value ("3 of 4 steps"). Default: the percentage. */
  valueText?: string
  tone?: 'primary' | 'success' | 'warning' | 'destructive'
  size?: 'sm' | 'md'
  className?: string
}

const fills = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
} as const

/**
 * A bar that fills from the left. The fill grows in when it appears (a CSS animation from zero), so a number that
 * was just computed reads as movement.
 */
export const Progress = ({
  label,
  value,
  max = 100,
  valueText,
  tone = 'primary',
  size = 'md',
  className,
}: ProgressProps) => {
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(Math.max(value, 0), max)}
      aria-valuetext={valueText ?? `${Math.round(ratio * 100)}%`}
      className={cn('overflow-hidden rounded-full well', size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
    >
      <div
        style={{ '--progress': ratio } as CSSProperties}
        className={cn(
          'h-full w-full origin-left scale-x-(--progress) animate-progress-grow rounded-full',
          'transition-transform duration-700 ease-out-expo',
          fills[tone],
        )}
      />
    </div>
  )
}
