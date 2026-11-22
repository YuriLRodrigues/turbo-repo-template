import { Button } from '@workspace/ui/components/button'

import { sections, site } from '@/config/site'

import { ThemeToggle } from './theme-toggle'

/** The sticky top of the page: the name, the sections (from 768px) and the two calls to the app. */
export const SiteHeader = () => (
  <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
    <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
      <a href="#top" className="flex items-center gap-2.5 font-display font-semibold">
        <span
          aria-hidden
          className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
        >
          {site.name.charAt(0)}
        </span>
        {site.name}
      </a>
      <nav aria-label="Sections" className="hidden md:block">
        <ul className="flex items-center gap-1">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="rounded-(--radius-control) px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          render={<a href={`${site.appUrl}/sign-in/`} />}
          className="hidden sm:inline-flex"
        >
          Sign in
        </Button>
        <Button size="sm" render={<a href={`${site.appUrl}/sign-up/`} />}>
          Start free
        </Button>
      </div>
    </div>
  </header>
)
