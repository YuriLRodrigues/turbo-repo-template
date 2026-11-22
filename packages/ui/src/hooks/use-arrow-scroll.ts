'use client'

import { useEffect, useRef, useState } from 'react'

/** Sub-pixel rounding: a row of 251.56px in a box of 251px does not overflow, and must not bring the arrows in. */
const TOLERANCE = 1

/** Each press of an arrow moves this share of what is visible: the last item of the stretch stays in view. */
const STEP = 0.8

/** The room an arrow takes at each end, in px: the focused or chosen item stops short of it. */
const ARROW_ROOM = 40

/** A press that travels more than this many px is a drag, not a click. */
const DRAG_THRESHOLD = 5

/** How each primitive marks its chosen item: a tab, a radio (segment, chip, swatch), a toggle. */
const CHOSEN = ['aria-selected', 'aria-checked', 'aria-pressed']

export type ArrowScrollDirection = -1 | 1

const prefersReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * What `ArrowScrollArea` knows about its row: whether it overflows and at which end the scroll is, plus the way to
 * move it by the arrows.
 *
 * - The first render always answers "it fits" (nothing is measured on the server), so server and client hydrate
 *   the same; the arrows come in after measuring.
 * - The item that takes the focus, or becomes the chosen one, is scrolled until it is whole between the two arrows.
 * - A mouse can drag the row; the click that ends a drag is swallowed, so dragging never chooses an item.
 * - With reduced motion every scroll is instant.
 */
export const useArrowScroll = () => {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ overflow: false, atStart: true, atEnd: true })

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const room = () => viewport.scrollWidth - viewport.clientWidth
    const behavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth')

    // Only this box moves (`scrollIntoView` could move the page) and the width of the arrows counts.
    const reveal = (item: Element | null | undefined, how: ScrollBehavior = behavior()) => {
      if (!item || room() <= TOLERANCE) return
      const frame = viewport.getBoundingClientRect()
      const box = item.getBoundingClientRect()
      const minLeft = frame.left + ARROW_ROOM
      const maxRight = frame.right - ARROW_ROOM
      const delta = box.left < minLeft ? box.left - minLeft : box.right > maxRight ? box.right - maxRight : 0
      if (delta) viewport.scrollBy({ left: delta, behavior: how })
    }

    let overflowing = false
    const measure = () => {
      const max = room()
      const offset = Math.abs(viewport.scrollLeft)
      const next = { overflow: max > TOLERANCE, atStart: offset <= TOLERANCE, atEnd: offset >= max - TOLERANCE }
      setState((previous) =>
        previous.overflow === next.overflow && previous.atStart === next.atStart && previous.atEnd === next.atEnd
          ? previous
          : next,
      )
      // The row has just stopped fitting (on arrival, or because the window shrank): what is chosen must not be left
      // out of sight. No animation: it is where the row starts, not a movement.
      if (next.overflow && !overflowing) {
        reveal(viewport.querySelector(CHOSEN.map((attribute) => `[${attribute}="true"]`).join(',')), 'auto')
      }
      overflowing = next.overflow
    }
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && event.target !== viewport) reveal(event.target)
    }
    const onChosen = (records: MutationRecord[]) => {
      const chosen = records
        .filter(
          (record) =>
            record.target instanceof Element && record.target.getAttribute(record.attributeName ?? '') === 'true',
        )
        .at(-1)
      reveal(chosen?.target as Element | undefined)
    }

    // Dragging with a mouse. Touch and trackpads already scroll natively.
    let drag: { from: number; left: number; moved: boolean } | null = null
    let swallowClick = false
    const onPointerMove = (event: PointerEvent) => {
      if (!drag) return
      const travelled = event.clientX - drag.from
      if (!drag.moved && Math.abs(travelled) < DRAG_THRESHOLD) return
      drag.moved = true
      viewport.setAttribute('data-dragging', '')
      viewport.scrollLeft = drag.left - travelled
    }
    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      viewport.removeAttribute('data-dragging')
      if (drag?.moved) {
        swallowClick = true
        // If no click follows (the pointer was released outside), the flag must not eat the next real click.
        window.setTimeout(() => (swallowClick = false), 0)
      }
      drag = null
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0 || room() <= TOLERANCE) return
      drag = { from: event.clientX, left: viewport.scrollLeft, moved: false }
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    }
    const onClickCapture = (event: MouseEvent) => {
      if (!swallowClick) return
      swallowClick = false
      event.preventDefault()
      event.stopPropagation()
    }

    const sizes = new ResizeObserver(measure)
    sizes.observe(viewport)
    for (const child of Array.from(viewport.children)) sizes.observe(child)
    const chosen = new MutationObserver(onChosen)
    chosen.observe(viewport, { subtree: true, attributes: true, attributeFilter: CHOSEN })
    viewport.addEventListener('scroll', measure, { passive: true })
    viewport.addEventListener('focusin', onFocus)
    viewport.addEventListener('pointerdown', onPointerDown)
    viewport.addEventListener('click', onClickCapture, true)
    measure()

    return () => {
      sizes.disconnect()
      chosen.disconnect()
      viewport.removeEventListener('scroll', measure)
      viewport.removeEventListener('focusin', onFocus)
      viewport.removeEventListener('pointerdown', onPointerDown)
      viewport.removeEventListener('click', onClickCapture, true)
      onPointerUp()
    }
  }, [])

  const scrollByPage = (direction: ArrowScrollDirection) => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollBy({
      left: direction * viewport.clientWidth * STEP,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    })
  }

  return { viewportRef, ...state, scrollByPage }
}
