# CLAUDE.md — apps/landing

## What this is

A minimal product page in three languages: Brazilian Portuguese (default, at `/`), English (`/en/`) and Spanish
(`/es/`). One Next.js 16 page per language as a static export, with the design system of the app, a few generic
sections (hero, features, how it works, FAQ, closing), a language switcher and the basic SEO (canonical and hreflang,
Open Graph with `og:locale` and a share image per language, the Twitter card, `robots.txt`, `sitemap.xml` with every
language). It is a starting point, not a design: replace the copy, keep the structure.

How the languages work, and how to add a key, a language or a page: `docs/patterns/web/i18n.md`.

## Commands

```bash
npm run dev -w landing        # http://localhost:3502 (and /en/, /es/)
npm run build -w landing      # out/: index.html, en/index.html, es/index.html, share.png per language
npm run preview -w landing    # serves out/ on :3502
npm run lint:check -w landing
npm run typecheck -w landing
```

`SITE_URL` (where the page is served, for canonical URLs, hreflang and the sitemap) and `NEXT_PUBLIC_APP_URL` (the web
app, for the sign-in and sign-up buttons) are read at build time; see `config/site.ts`.

## Map

```
app/(pt)/                   root layout (<html lang="pt-BR">), page and share.png of the default language
app/(intl)/[lang]/          root layout, page and share.png of en and es (generateStaticParams)
app/root-document.tsx       the <html> of every root layout: lang, fonts, BOOT_SCRIPT
app/global-not-found.tsx    the 404 of the whole site (experimental.globalNotFound)
app/robots.ts, sitemap.ts   static SEO files (dynamic = 'force-static')
i18n/                       config (languages), routing (paths, hreflang), dictionaries, metadata, params
components/home-page.tsx    the order of the sections
components/sections.tsx     the sections (the words come from the dictionary)
components/site-header.tsx  sticky header: section links, language, theme, the calls to the app
components/site-footer.tsx  footer: the language pill, the rights, the links
components/language/        the language switcher (+ CSS module), the flags, the map of the globe
config/site.ts              name, URLs and the list of sections (what does not change with the language)
```

## Rules

- Every word of the page comes from `i18n/dictionaries/` (copy, metadata, alt, `aria-label`): no string in a
  component. A new key goes to `pt.ts` first; the typecheck then asks for it in `en.ts` and `es.ts`.
- Client components get words as props, never the dictionaries (the 404 is the exception: it learns its language in
  the browser).
- Links between languages are real `<a href>` with `hrefLang`; paths come from `localePath`, never written by hand.
- The same rules of style as the web app: roles of the tokens, primitives of `@workspace/ui`, no raw overflow.
- Every section is a `<section id aria-labelledby>` with one `h2`; the page has one `h1`.
- A new section: its words in the three dictionaries, its component in `components/sections.tsx`, its place in
  `components/home-page.tsx` and, if it belongs in the header, in `sections` of `config/site.ts` (with its key in
  `nav`).
- Client JavaScript only where something must react: the theme toggle, the language switcher and the 404.
