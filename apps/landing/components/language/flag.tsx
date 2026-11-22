import { type JSX, useId } from 'react'

import { cn } from '@workspace/ui/lib/cn'

import type { Locale } from '@/i18n/config'

// Flags drawn in SVG (flag emoji do not show on Windows). Simplified drawings, cut into a circle.
const Brazil = () => (
  <>
    <rect width="24" height="24" fill="#009c3b" />
    <path d="M12 4.2 21.2 12 12 19.8 2.8 12Z" fill="#ffdf00" />
    <circle cx="12" cy="12" r="4.4" fill="#002776" />
    <path d="M7.8 11.2c2.8-.9 5.9-.6 8.4.9" stroke="#fff" strokeWidth="0.9" fill="none" />
  </>
)

const UnitedStates = () => (
  <>
    <rect width="24" height="24" fill="#fff" />
    {[0, 2, 4, 6, 8, 10, 12].map((row) => (
      <rect key={row} y={(row * 24) / 13} width="24" height={24 / 13} fill="#b22234" />
    ))}
    <rect width="11" height={(24 / 13) * 7} fill="#3c3b6e" />
  </>
)

const Spain = () => (
  <>
    <rect width="24" height="24" fill="#aa151b" />
    <rect y="6" width="24" height="12" fill="#f1bf00" />
    <rect x="6" y="9.6" width="3.4" height="4.8" rx="0.8" fill="#aa151b" opacity="0.85" />
  </>
)

/** One flag per language: a new language adds its drawing here (TypeScript says which one is missing). */
const flags: Record<Locale, () => JSX.Element> = { pt: Brazil, en: UnitedStates, es: Spain }

/** The round flag of a language. Decorative: the name of the language is always written next to it. */
export const Flag = ({ locale, className }: { locale: Locale; className?: string }) => {
  // The same flag shows more than once on the page (the badge, the panel): each one has its own clip.
  const clip = `flag-${locale}-${useId()}`

  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn('size-5 shrink-0 rounded-full', className)}>
      <clipPath id={clip}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>{flags[locale]()}</g>
    </svg>
  )
}
