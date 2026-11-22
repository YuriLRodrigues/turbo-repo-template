import { sections, site } from '@/config/site'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

import { LanguageSwitcher } from './language/language-switcher'

/** The bottom of the page: the language (the pill, its panel opens upwards), the rights and the links again. */
export const SiteFooter = ({ lang }: { lang: Locale }) => {
  const { nav, footer } = getDictionary(lang)

  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <LanguageSwitcher lang={lang} label={nav.language} variant="labeled" className="self-start sm:self-auto" />
          <p>
            © {new Date().getFullYear()} {site.name}. {footer.rights}
          </p>
        </div>
        <nav aria-label={nav.footer}>
          <ul className="flex flex-wrap gap-4">
            {sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="hover:text-foreground">
                  {nav[section.label]}
                </a>
              </li>
            ))}
            <li>
              <a href={`${site.appUrl}/sign-in/`} className="hover:text-foreground">
                {nav.signIn}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
