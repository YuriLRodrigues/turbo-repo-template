'use client'

import { type CSSProperties, type MouseEvent, useEffect, useId, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { ChevronUpIcon } from 'lucide-react'

import { Tooltip } from '@workspace/ui/components/tooltip'
import { cn } from '@workspace/ui/lib/cn'

import { type Locale, localeMeta, locales } from '@/i18n/config'
import { localePath, stripLocale } from '@/i18n/routing'

import { Flag } from './flag'
import { LAND_PATH } from './globe-land'
import styles from './language-switcher.module.css'

/** The session key that tells the new page it was reached by a switch of language (the globe "lands"). */
const SWITCH_KEY = 'app.locale-switch'
/** How long the choice animates before the navigation starts. */
const SWITCH_DELAY = 520
/** The space the panel keeps from the edges of the screen when it has to move to fit. */
const EDGE = 16

/** Less motion: the system setting or the switch of the appearance (`data-motion="reduced"` on <html>). */
const reducedMotion = () =>
  document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** A one-color little planet that spins (the layers and the motion are in the CSS module). */
const Globe = () => (
  <span aria-hidden className={styles.globe}>
    <span className={styles.tilt}>
      <span className={styles.spin}>
        <span className={styles.boost}>
          <svg viewBox="0 0 1080 180" preserveAspectRatio="none" className={styles.map}>
            {[0, 360, 720].map((x) => (
              <path key={x} d={LAND_PATH} transform={`translate(${x} 0)`} />
            ))}
          </svg>
        </span>
      </span>
    </span>
    <span className={styles.shade} />
  </span>
)

type LanguageSwitcherProps = {
  lang: Locale
  /** The word "Language" in the language of the page (`dict.nav.language`). */
  label: string
  /**
   * `icon`: the globe alone with the flag badge and a tooltip, the panel opening downwards (the header).
   * `labeled`: a pill with the globe, the name of the language and the flag, the panel opening upwards (the footer, or
   * the bottom of a phone menu).
   */
  variant?: 'icon' | 'labeled'
  className?: string
}

/**
 * Switches the language and keeps the page (`/` ↔ `/en/` ↔ `/es/`). The globe opens the panel with the flags; on a
 * choice the highlight slides to the language, the flag flips like a coin with two "pings", the globe speeds up and
 * the badge turns to the new flag; only then the navigation starts. The links are real `<a href>` (a new tab and the
 * crawlers keep working), with `hrefLang` and `lang`.
 */
export const LanguageSwitcher = ({ lang, label, variant = 'icon', className }: LanguageSwitcherProps) => {
  const path = stripLocale(usePathname() || '/')
  const router = useRouter()
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<Locale | null>(null)
  const [pending, setPending] = useState<Locale | null>(null)
  const [lastLang, setLastLang] = useState(lang)
  const [shift, setShift] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const timer = useRef(0)

  // The new language arrived without a reload (en ↔ es share the layout): the panel closed, no pending choice.
  if (lastLang !== lang) {
    setLastLang(lang)
    setOpen(false)
    setPending(null)
    setHovered(null)
  }

  const close = (focusTrigger = false) => {
    setOpen(false)
    setHovered(null)
    if (focusTrigger) triggerRef.current?.focus()
  }

  // Open: a click outside closes it; Esc closes only the panel (captured on the window, before any other Esc).
  useEffect(() => {
    if (!open) return
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey, true)

    return () => {
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  // The new page after a switch: the globe spins fast and the badge with the flag drops into place.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SWITCH_KEY) !== lang) return
      sessionStorage.removeItem(SWITCH_KEY)
    } catch {
      return
    }
    const trigger = triggerRef.current
    if (!trigger) return
    trigger.dataset.landed = ''
    const landed = window.setTimeout(() => delete trigger.dataset.landed, 1100)

    return () => window.clearTimeout(landed)
  }, [lang])

  useEffect(() => {
    const pendingTimer = timer

    return () => window.clearTimeout(pendingTimer.current)
  }, [])

  /**
   * How far the panel moves sideways to stay on the screen. It hangs from the edge of the switcher (the right edge in
   * the header, the left edge in the pill); on a phone the globe is not at the edge of the screen, so the panel slides
   * in by what is missing and the circle still grows from the globe (`--dx` in the CSS module).
   */
  const fit = () => {
    const root = rootRef.current
    const panel = panelRef.current
    if (!root || !panel) return 0
    const { left, right } = root.getBoundingClientRect()
    const screen = document.documentElement.clientWidth

    return variant === 'labeled'
      ? Math.min(0, screen - EDGE - (left + panel.offsetWidth))
      : Math.max(0, EDGE - (right - panel.offsetWidth))
  }

  const toggle = () => {
    if (pending) return
    if (open) return close()
    setShift(fit())
    setOpen(true)
    for (const locale of locales) if (locale !== lang) router.prefetch(localePath(locale, path))
  }

  const choose = (event: MouseEvent<HTMLAnchorElement>, locale: Locale, href: string) => {
    // A new tab, a new window or a download: the normal behavior of the link.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (pending) return
    if (locale === lang) return close(true)

    setPending(locale)
    try {
      sessionStorage.setItem(SWITCH_KEY, locale)
    } catch {
      // No storage (a private tab, blocked): it switches all the same, only without the landing.
    }
    timer.current = window.setTimeout(() => router.push(href), reducedMotion() ? 0 : SWITCH_DELAY)
  }

  const shown = pending ?? lang
  const pointed = pending ?? hovered ?? lang
  const labeled = variant === 'labeled'
  const current = `${label}: ${localeMeta[lang].label} (${localeMeta[lang].short})`

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls={panelId}
      data-switching={pending ? '' : undefined}
      className={cn(
        styles.trigger,
        'relative cursor-pointer rounded-full',
        labeled
          ? cn(styles.pill, 'flex h-11 items-center gap-2.5 border border-border pr-3.5 pl-1.5 text-foreground')
          : 'grid size-(--trigger) place-items-center text-muted-foreground hover:text-foreground',
        open ? 'bg-muted text-foreground' : 'hover:bg-muted',
      )}
    >
      <span className="sr-only">{current}</span>
      <Globe />
      {labeled ? (
        <>
          <span aria-hidden className="grid text-left leading-tight">
            <span className="text-[0.6875rem] text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">
              {localeMeta[shown].label}{' '}
              <span className="font-normal text-muted-foreground">· {localeMeta[shown].short}</span>
            </span>
          </span>
          <span key={shown} aria-hidden className={cn(styles.badge, 'ml-0.5 rounded-full ring-1 ring-border')}>
            <Flag locale={shown} className="size-5" />
          </span>
          <ChevronUpIcon
            aria-hidden
            className={cn(
              'size-4 text-muted-foreground transition-transform duration-300',
              open ? 'rotate-180' : 'rotate-0',
            )}
          />
        </>
      ) : (
        // The badge sits on the edge of the globe, not loose in the corner of the button.
        <span
          key={shown}
          aria-hidden
          className={cn(styles.badge, 'absolute right-0.5 bottom-0.5 rounded-full ring-2 ring-background')}
        >
          <Flag locale={shown} className="size-3.5" />
        </span>
      )}
    </button>
  )

  return (
    <div
      ref={rootRef}
      data-open={open ? '' : undefined}
      className={cn(styles.root, 'relative', className)}
      onBlur={(event) => {
        if (!pending && !event.currentTarget.contains(event.relatedTarget as Node | null)) close()
      }}
    >
      {labeled ? (
        trigger
      ) : (
        <Tooltip label={current} side="bottom" disabled={open || Boolean(pending)}>
          {trigger}
        </Tooltip>
      )}

      <div
        ref={panelRef}
        id={panelId}
        aria-hidden={!open}
        inert={!open}
        style={{ '--dx': `${shift}px` } as CSSProperties}
        className={cn(
          styles.panel,
          labeled ? styles.up : styles.down,
          'absolute z-50 w-60 max-w-[calc(100vw-2rem)] rounded-(--radius-sheet) border border-border bg-popover/95 p-1.5 text-popover-foreground shadow-elevation-lg backdrop-blur-xl backdrop-saturate-150',
        )}
      >
        <p
          className={cn(styles.item, 'px-3 pt-2 pb-2 text-xs font-medium text-muted-foreground')}
          style={{ '--i': 0 } as CSSProperties}
        >
          {label}
        </p>
        <ul className="relative grid gap-1 [--gap:0.25rem] [--row:2.75rem]" onPointerLeave={() => setHovered(null)}>
          <span
            aria-hidden
            className={cn(
              styles.highlight,
              'pointer-events-none absolute inset-x-0 top-0 h-(--row) rounded-(--radius-control) border',
              pointed === shown ? 'border-primary/30 bg-primary-soft' : 'border-transparent bg-muted',
            )}
            style={{ '--at': locales.indexOf(pointed) } as CSSProperties}
          />
          {locales.map((locale, index) => {
            const href = localePath(locale, path)

            return (
              <li key={locale}>
                <Link
                  href={href}
                  hrefLang={localeMeta[locale].htmlLang}
                  lang={localeMeta[locale].htmlLang}
                  aria-current={locale === lang ? 'true' : undefined}
                  data-selected={locale === shown ? '' : undefined}
                  data-pending={locale === pending ? '' : undefined}
                  onClick={(event) => choose(event, locale, href)}
                  onPointerEnter={() => setHovered(locale)}
                  onFocus={() => setHovered(locale)}
                  className={cn(
                    styles.item,
                    'relative flex h-(--row) items-center gap-3 rounded-(--radius-control) px-3 text-sm font-medium outline-offset-[-2px]',
                    locale === shown ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                  style={{ '--i': index + 1 } as CSSProperties}
                >
                  <span className="relative grid size-6 shrink-0 place-items-center">
                    <span
                      aria-hidden
                      className={cn(styles.ping, 'absolute inset-0 rounded-full border border-primary')}
                    />
                    <span aria-hidden className={cn(styles.ping, 'absolute inset-0 rounded-full bg-primary/25')} />
                    <span className={styles.coin}>
                      <Flag locale={locale} className={cn(styles.flag, 'size-6 ring-1 ring-border')} />
                    </span>
                  </span>
                  {localeMeta[locale].label}
                  <span className="ml-auto flex items-center gap-2">
                    <span className="font-mono text-[0.6875rem] tracking-wider text-muted-foreground">
                      {localeMeta[locale].short}
                    </span>
                    <svg viewBox="0 0 24 24" aria-hidden className="size-4 text-primary-text">
                      <path
                        d="M5 12.5 9.5 17 19 7.5"
                        pathLength={1}
                        className={styles.check}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
