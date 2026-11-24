import { Button } from '@workspace/ui/components/button'

import { sections, site } from '@/config/site'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

import { LanguageSwitcher } from './language/language-switcher'
import { ThemeToggle } from './theme-toggle'

/** The sticky top of the page: the name, the sections (from 768px), the language, the theme and the calls to the app. */
export const SiteHeader = ({ lang }: { lang: Locale }) => {
  const { nav } = getDictionary(lang)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <a
          href="#top"
          aria-label={`${site.name}, ${nav.home}`}
          className="flex items-center gap-2.5 font-display font-semibold"
        >
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground"
          >
            {site.name.charAt(0)}
          </span>
          {site.name}
        </a>
        <nav aria-label={nav.sections} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="rounded-(--radius-control) px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {nav[section.label]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <LanguageSwitcher lang={lang} label={nav.language} />
          <ThemeToggle labels={{ light: nav.useLight, dark: nav.useDark }} />
          <Button
            variant="ghost"
            size="sm"
            render={<a href={`${site.appUrl}/sign-in/`} />}
            className="hidden sm:inline-flex"
          >
            {nav.signIn}
          </Button>
          <Button size="sm" render={<a href={`${site.appUrl}/sign-up/`} />}>
            {nav.start}
          </Button>
        </div>
      </div>
    </header>
  )
}
