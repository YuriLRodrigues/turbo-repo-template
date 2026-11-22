'use client'

import { type RefObject, useEffect, useState } from 'react'

export type ElementSize = { width: number; height: number }

/**
 * The size of an element in CSS pixels, kept current. Charts draw in real pixels (so strokes and dots are never
 * stretched): they render at `fallback` on the server and at the measured size right after.
 */
export const useElementSize = (ref: RefObject<Element | null>, fallback: ElementSize): ElementSize => {
  const [size, setSize] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry?.contentRect.width ?? 0)
      const height = Math.round(entry?.contentRect.height ?? 0)
      if (width <= 0) return
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }))
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref])

  return size
}
