'use client'

import { type ComponentProps, type PointerEvent, type ReactNode, type RefObject, useEffect, useRef } from 'react'

import { cn } from '../lib/cn'

type Axis = 'x' | 'y' | 'both'

type ScrollAreaProps = {
  children: ReactNode
  /** Which way the content may overflow. */
  axis?: Axis
  /**
   * The accessible name the region gets while it scrolls ("Notes of this week"). Leave it out only when
   * `viewportProps` already names the viewport (`aria-labelledby`).
   */
  label?: string
  /** Fade the edge where more content is waiting. */
  fade?: boolean
  /**
   * `always`: a tab stop even when nothing overflows (a panel that will grow). `never`: the box is not a tab stop
   * and is not announced as a region, because the keyboard already walks the items inside it (a row of tabs).
   */
  focusable?: 'when-scrollable' | 'always' | 'never'
  /** `hidden`: no thumb at all, for a row that is moved by arrows, drag, wheel and keyboard (`ArrowScrollArea`). */
  scrollbar?: 'auto' | 'hidden'
  /** The outer box: give it the size (height, max-height, flex-1). */
  className?: string
  /** The scrolling box: padding and background of the content go here. */
  viewportClassName?: string
  viewportRef?: RefObject<HTMLDivElement | null>
  /** Extra attributes of the viewport: an id, a role, `aria-labelledby`. */
  viewportProps?: Omit<ComponentProps<'div'>, 'className' | 'children' | 'ref'>
}

/** How long the thumb stays after the last scroll event. */
const IDLE_MS = 900
const MIN_THUMB = 28

/**
 * The only scrolling box of the app (lint blocks raw `overflow-auto`/`overflow-scroll` classes elsewhere; see
 * docs/patterns/web/scroll-area.md).
 *
 * - The native scrollbar is hidden. A thin rounded thumb appears on hover (the pointer over the box), while it
 *   scrolls and while the keyboard focus is inside; otherwise it fades out. On touch there is no hover: it shows
 *   while scrolling. It can be dragged; wheel, touch and keyboard scroll natively.
 * - While the content overflows, the viewport is a tab stop with a visible focus ring, `role="region"` and the
 *   `label`, so the keyboard can scroll it and a screen reader knows what it is. When nothing overflows it is none
 *   of that, so it adds no noise.
 * - `fade` masks the edge that hides more content.
 *
 * A compact row of controls that may not fit (tabs, segments, chips) is not this: it is `ArrowScrollArea`, which
 * never shows a bar.
 *
 * Geometry is written straight to the DOM from scroll and resize events: no React state, no re-render per frame.
 */
export const ScrollArea = ({
  children,
  axis = 'y',
  label,
  fade = false,
  focusable = 'when-scrollable',
  scrollbar = 'auto',
  className,
  viewportClassName,
  viewportRef,
  viewportProps,
}: ScrollAreaProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const ownRef = useRef<HTMLDivElement>(null)
  const innerRef = viewportRef ?? ownRef
  const thumbX = useRef<HTMLSpanElement>(null)
  const thumbY = useRef<HTMLSpanElement>(null)
  const viewportRole = viewportProps?.role

  useEffect(() => {
    const root = rootRef.current
    const viewport = innerRef.current
    if (!root || !viewport) return
    let idle = 0

    const measure = () => {
      const overflowX = axis !== 'y' && viewport.scrollWidth > viewport.clientWidth + 1
      const overflowY = axis !== 'x' && viewport.scrollHeight > viewport.clientHeight + 1
      root.toggleAttribute('data-overflow-x', overflowX)
      root.toggleAttribute('data-overflow-y', overflowY)

      // Only a region that scrolls is announced and takes a tab stop.
      const scrolls = overflowX || overflowY
      if (focusable === 'never') viewport.tabIndex = -1
      else if (scrolls || focusable === 'always') viewport.tabIndex = 0
      else viewport.removeAttribute('tabindex')
      if (label && !viewportRole && focusable !== 'never') {
        if (scrolls) {
          viewport.setAttribute('role', 'region')
          viewport.setAttribute('aria-label', label)
        } else {
          viewport.removeAttribute('role')
          viewport.removeAttribute('aria-label')
        }
      }

      if (overflowX && thumbX.current) {
        const track = viewport.clientWidth - 12
        const size = Math.max(MIN_THUMB, (viewport.clientWidth / viewport.scrollWidth) * track)
        const at = (viewport.scrollLeft / (viewport.scrollWidth - viewport.clientWidth)) * (track - size)
        thumbX.current.style.width = `${size}px`
        thumbX.current.style.transform = `translateX(${at}px)`
      }
      if (overflowY && thumbY.current) {
        const track = viewport.clientHeight - 12
        const size = Math.max(MIN_THUMB, (viewport.clientHeight / viewport.scrollHeight) * track)
        const at = (viewport.scrollTop / (viewport.scrollHeight - viewport.clientHeight)) * (track - size)
        thumbY.current.style.height = `${size}px`
        thumbY.current.style.transform = `translateY(${at}px)`
      }

      // Where more content waits, for the edge fades.
      const startX = viewport.scrollLeft > 1
      const endX = viewport.scrollLeft < viewport.scrollWidth - viewport.clientWidth - 1
      const startY = viewport.scrollTop > 1
      const endY = viewport.scrollTop < viewport.scrollHeight - viewport.clientHeight - 1
      root.dataset.more = [
        overflowX && startX && 'left',
        overflowX && endX && 'right',
        overflowY && startY && 'top',
        overflowY && endY && 'bottom',
      ]
        .filter(Boolean)
        .join(' ')
    }

    const onScroll = () => {
      measure()
      root.setAttribute('data-scrolling', '')
      window.clearTimeout(idle)
      idle = window.setTimeout(() => root.removeAttribute('data-scrolling'), IDLE_MS)
    }

    measure()
    viewport.addEventListener('scroll', onScroll, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    for (const child of Array.from(viewport.children)) observer.observe(child)
    // Content that grows without resizing a direct child (a list getting rows) still has to be measured.
    const mutations = new MutationObserver(measure)
    mutations.observe(viewport, { childList: true, subtree: true })

    return () => {
      window.clearTimeout(idle)
      viewport.removeEventListener('scroll', onScroll)
      observer.disconnect()
      mutations.disconnect()
    }
  }, [axis, label, focusable, viewportRole, innerRef])

  // Dragging a thumb: the pointer's movement along the track, scaled to the content.
  const drag = (direction: 'x' | 'y') => (event: PointerEvent<HTMLSpanElement>) => {
    const viewport = innerRef.current
    if (!viewport) return
    event.preventDefault()
    const thumb = event.currentTarget
    thumb.setPointerCapture(event.pointerId)
    const from = direction === 'x' ? event.clientX : event.clientY
    const scrollFrom = direction === 'x' ? viewport.scrollLeft : viewport.scrollTop
    const ratio =
      direction === 'x' ? viewport.scrollWidth / viewport.clientWidth : viewport.scrollHeight / viewport.clientHeight

    const onMove = (move: globalThis.PointerEvent) => {
      const delta = ((direction === 'x' ? move.clientX : move.clientY) - from) * ratio
      if (direction === 'x') viewport.scrollLeft = scrollFrom + delta
      else viewport.scrollTop = scrollFrom + delta
    }
    const onUp = () => {
      thumb.removeEventListener('pointermove', onMove)
      thumb.removeEventListener('pointerup', onUp)
      thumb.removeEventListener('pointercancel', onUp)
    }
    thumb.addEventListener('pointermove', onMove)
    thumb.addEventListener('pointerup', onUp)
    thumb.addEventListener('pointercancel', onUp)
  }

  return (
    <div ref={rootRef} data-axis={axis} data-fade={fade ? '' : undefined} className={cn('scroll-area', className)}>
      <div
        {...viewportProps}
        ref={innerRef}
        tabIndex={focusable === 'always' ? 0 : focusable === 'never' ? -1 : undefined}
        className={cn('scroll-area-viewport', viewportClassName)}
      >
        {children}
      </div>
      {scrollbar === 'auto' && axis !== 'y' && (
        <span aria-hidden="true" className="scroll-area-track scroll-area-track-x">
          <span ref={thumbX} onPointerDown={drag('x')} className="scroll-area-thumb" />
        </span>
      )}
      {scrollbar === 'auto' && axis !== 'x' && (
        <span aria-hidden="true" className="scroll-area-track scroll-area-track-y">
          <span ref={thumbY} onPointerDown={drag('y')} className="scroll-area-thumb" />
        </span>
      )}
    </div>
  )
}
