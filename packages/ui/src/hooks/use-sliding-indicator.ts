'use client'

import { type RefObject, useEffect, useLayoutEffect } from 'react'

// The indicator has to be in place before the first paint on the client; on the server there is nothing to measure.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * Keeps a sliding indicator (the lozenge of the tab bar, the thumb of a segmented control) under the active item.
 *
 * It measures the element matching `activeSelector` inside `containerRef` and writes `--indicator-x`,
 * `--indicator-y`, `--indicator-width` and `--indicator-height` on the container; the indicator is positioned with
 * them and animates with a CSS transition. Geometry goes straight to the DOM: no state, no re-render.
 *
 * `key` is whatever makes the active item change (the value, the pathname).
 */
export const useSlidingIndicator = (
  containerRef: RefObject<HTMLElement | null>,
  activeSelector: string,
  key: unknown,
): void => {
  useIsomorphicLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measure = () => {
      const active = container.querySelector<HTMLElement>(activeSelector)
      if (!active) {
        container.removeAttribute('data-indicator')

        return
      }
      container.style.setProperty('--indicator-x', `${active.offsetLeft}px`)
      container.style.setProperty('--indicator-y', `${active.offsetTop}px`)
      container.style.setProperty('--indicator-width', `${active.offsetWidth}px`)
      container.style.setProperty('--indicator-height', `${active.offsetHeight}px`)
      // The first measurement must not animate from the corner: the attribute turns the transition on afterwards.
      if (!container.hasAttribute('data-indicator')) {
        container.setAttribute('data-indicator', 'placed')
        requestAnimationFrame(() => container.setAttribute('data-indicator', 'ready'))
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    for (const child of Array.from(container.children)) observer.observe(child)

    return () => observer.disconnect()
  }, [containerRef, activeSelector, key])
}
