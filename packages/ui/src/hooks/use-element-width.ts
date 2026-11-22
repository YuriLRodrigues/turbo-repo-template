'use client'

import type { RefObject } from 'react'

import { useElementSize } from './use-element-size'

/** The width of an element in CSS pixels, kept current: `useElementSize` for what only draws to its width. */
export const useElementWidth = (ref: RefObject<Element | null>, fallback: number): number =>
  useElementSize(ref, { width: fallback, height: 0 }).width
