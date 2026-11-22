import { sections, site } from '@/config/site'

export const SiteFooter = () => (
  <footer className="border-t border-border py-10">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>
        © {new Date().getFullYear()} {site.name}
      </p>
      <nav aria-label="Footer">
        <ul className="flex flex-wrap gap-4">
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="hover:text-foreground">
                {section.label}
              </a>
            </li>
          ))}
          <li>
            <a href={`${site.appUrl}/sign-in/`} className="hover:text-foreground">
              Sign in
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
)
