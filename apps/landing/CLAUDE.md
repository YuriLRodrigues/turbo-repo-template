# CLAUDE.md — apps/landing

## What this is

A minimal product page: one Next.js 16 page as a static export, with the design system of the app, a few generic
sections (hero, features, how it works, FAQ, closing) and the basic SEO (metadata with canonical, Open Graph and the
Twitter card, `robots.txt`, `sitemap.xml`, a generated share image). It is a starting point, not a design: replace the
copy, keep the structure.

## Commands

```bash
npm run dev -w landing        # http://localhost:3502
npm run build -w landing      # out/
npm run preview -w landing    # serves out/ on :3502
npm run lint:check -w landing
npm run typecheck -w landing
```

`SITE_URL` (where the page is served, for canonical URLs and the sitemap) and `NEXT_PUBLIC_APP_URL` (the web app, for
the sign-in and sign-up buttons) are read at build time; see `config/site.ts`.

## Map

```
app/layout.tsx              metadata (SEO), fonts, BOOT_SCRIPT
app/page.tsx                the order of the sections
app/robots.ts, sitemap.ts, opengraph-image.tsx   static SEO files (dynamic = 'force-static')
components/sections.tsx     the sections and their copy
components/site-header.tsx  sticky header with the section links and the calls to the app
config/site.ts              name, title, description, URLs and the list of sections
```

## Rules

- The same rules of style as the web app: roles of the tokens, primitives of `@workspace/ui`, no raw overflow.
- Every section is a `<section id aria-labelledby>` with one `h2`; the page has one `h1`.
- A new section: add it to `components/sections.tsx`, to `app/page.tsx` and, if it belongs in the header, to
  `sections` in `config/site.ts`.
- No client JavaScript unless something must react (the theme toggle is the only client component).
