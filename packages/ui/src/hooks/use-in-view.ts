'use client'

import { type RefObject, useEffect, useState } from 'react'

/** Whether the element is on screen (any part of it). Starts `false`; `once` keeps it `true` after the first time. */
export const useInView = (ref: RefObject<Element | null>, options: { once?: boolean; margin?: string } = {}) => {
  const { once = false, margin = '0px' } = options
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) observer.disconnect()
      },
      { rootMargin: margin },
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [ref, once, margin])

  return inView
}
