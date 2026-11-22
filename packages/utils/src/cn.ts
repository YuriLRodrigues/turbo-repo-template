import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins class names and lets the last Tailwind utility of a group win (`cn('px-2', className)`). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
